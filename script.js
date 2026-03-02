class SocialMediaImageCreator {
	constructor() {
		this.canvas = document.getElementById("canvas");
		this.ctx = this.canvas.getContext("2d");
		this.uploadedImage = null;
		this.currentSettings = {
			canvasSize: "opengraph",
			skewX: 5,
			skewY: 5.5,
			grayscale: 100,
			zoom: 100,
			opacity: 100,
			grain: 0,
			dofIntensity: 0,
			dofSize: 50,
			dofFocusX: 50,
			dofFocusY: 50,
			titleText: "",
			bodyText: "",
			textColor: "#ffffff",
			textAlign: "left",
			titleSize: 48,
			bodySize: 24,
			imageX: 0,
			imageY: 0,
			backgroundColor: "#2a2a2a",
			transparentBackground: false,
		};

		this.canvasSizes = {
			"twitter-banner": { width: 1500, height: 500 },
			"twitter-timeline": { width: 1200, height: 675 },
			opengraph: { width: 1200, height: 630 },
			"16-9": { width: 1280, height: 720 },
			email: { width: 545, height: 310 },
			custom: { width: 1200, height: 630 },
		};

		this.isDragging = false;
		this.lastMousePos = { x: 0, y: 0 };

		// Performance: rAF batching
		this._drawPending = false;
		this._fullDrawPending = false;

		// Performance: reusable offscreen canvas for DoF
		this._offscreen = null;
		this._offCtx = null;

		// Performance: debounced save
		this._saveTimer = null;

		this.init();
		this.loadSettings();
		this.updateCanvasSize();
		this.drawCanvas();
	}

	init() {
		this.setupEventListeners();
		this.setupCanvasDragEvents();
		this.setupCanvasDropZone();
		this.setupCollapsibleSections();
		this.setupMobileSidebar();
	}

	// ─── Performance: batched rendering ───

	requestDraw(full = true) {
		if (full) this._fullDrawPending = true;
		if (this._drawPending) return;
		this._drawPending = true;
		requestAnimationFrame(() => {
			this._drawPending = false;
			const full = this._fullDrawPending;
			this._fullDrawPending = false;
			if (full) {
				this.drawCanvas();
			} else {
				this.drawCanvasLight();
			}
		});
	}

	debouncedSave() {
		clearTimeout(this._saveTimer);
		this._saveTimer = setTimeout(() => this.saveSettings(), 300);
	}

	// ─── Event Listeners ───

	setupEventListeners() {
		const fileInput = document.getElementById("imageUpload");
		fileInput.addEventListener("change", (e) => this.handleFileUpload(e));

		document.getElementById("canvasSize").addEventListener("change", (e) => {
			this.currentSettings.canvasSize = e.target.value;
			this.updateCanvasSize();
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("customWidth").addEventListener("input", () => {
			if (this.currentSettings.canvasSize === "custom") {
				this.updateCanvasSize();
				this.requestDraw();
			}
		});

		document.getElementById("customHeight").addEventListener("input", () => {
			if (this.currentSettings.canvasSize === "custom") {
				this.updateCanvasSize();
				this.requestDraw();
			}
		});

		// Effect controls
		document.getElementById("skewX").addEventListener("input", (e) => {
			this.currentSettings.skewX = parseFloat(e.target.value);
			document.getElementById("skewXValue").textContent = `${e.target.value}°`;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("skewY").addEventListener("input", (e) => {
			this.currentSettings.skewY = parseFloat(e.target.value);
			document.getElementById("skewYValue").textContent = `${e.target.value}°`;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("grayscale").addEventListener("input", (e) => {
			this.currentSettings.grayscale = parseInt(e.target.value);
			document.getElementById("grayscaleValue").textContent = `${e.target.value}%`;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("zoom").addEventListener("input", (e) => {
			this.currentSettings.zoom = parseInt(e.target.value);
			document.getElementById("zoomValue").textContent = `${e.target.value}%`;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("opacity").addEventListener("input", (e) => {
			this.currentSettings.opacity = parseInt(e.target.value);
			document.getElementById("opacityValue").textContent = `${e.target.value}%`;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("grain").addEventListener("input", (e) => {
			this.currentSettings.grain = parseInt(e.target.value);
			document.getElementById("grainValue").textContent = `${e.target.value}%`;
			this.requestDraw();
			this.debouncedSave();
		});

		// Depth of field controls
		document.getElementById("dofIntensity").addEventListener("input", (e) => {
			this.currentSettings.dofIntensity = parseFloat(e.target.value);
			document.getElementById("dofIntensityValue").textContent = `${e.target.value}px`;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("dofSize").addEventListener("input", (e) => {
			this.currentSettings.dofSize = parseInt(e.target.value);
			document.getElementById("dofSizeValue").textContent = `${e.target.value}%`;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("dofFocusX").addEventListener("input", (e) => {
			this.currentSettings.dofFocusX = parseInt(e.target.value);
			document.getElementById("dofFocusXValue").textContent = `${e.target.value}%`;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("dofFocusY").addEventListener("input", (e) => {
			this.currentSettings.dofFocusY = parseInt(e.target.value);
			document.getElementById("dofFocusYValue").textContent = `${e.target.value}%`;
			this.requestDraw();
			this.debouncedSave();
		});

		// Text controls
		document.getElementById("titleText").addEventListener("input", (e) => {
			this.currentSettings.titleText = e.target.value;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("bodyText").addEventListener("input", (e) => {
			this.currentSettings.bodyText = e.target.value;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("textColor").addEventListener("input", (e) => {
			this.currentSettings.textColor = e.target.value;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("textAlign").addEventListener("change", (e) => {
			this.currentSettings.textAlign = e.target.value;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("titleSize").addEventListener("input", (e) => {
			this.currentSettings.titleSize = parseInt(e.target.value);
			document.getElementById("titleSizeValue").textContent = `${e.target.value}px`;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("bodySize").addEventListener("input", (e) => {
			this.currentSettings.bodySize = parseInt(e.target.value);
			document.getElementById("bodySizeValue").textContent = `${e.target.value}px`;
			this.requestDraw();
			this.debouncedSave();
		});

		// Background controls
		document.getElementById("backgroundColor").addEventListener("input", (e) => {
			this.currentSettings.backgroundColor = e.target.value;
			this.requestDraw();
			this.debouncedSave();
		});

		document.getElementById("transparentBackground").addEventListener("change", (e) => {
			this.currentSettings.transparentBackground = e.target.checked;
			this.requestDraw();
			this.debouncedSave();
		});

		// Action buttons
		document.getElementById("resetBtn").addEventListener("click", () => this.resetAll());
		document.getElementById("resetPositionBtn").addEventListener("click", () => this.resetImagePosition());
		document.getElementById("downloadBtn").addEventListener("click", () => this.downloadImage());
	}

	setupCanvasDropZone() {
		const canvasArea = document.querySelector(".canvas-area");
		const fileInput = document.getElementById("imageUpload");

		canvasArea.addEventListener("dragover", (e) => {
			e.preventDefault();
			canvasArea.classList.add("dragover");
		});

		canvasArea.addEventListener("dragleave", (e) => {
			if (!canvasArea.contains(e.relatedTarget)) {
				canvasArea.classList.remove("dragover");
			}
		});

		canvasArea.addEventListener("drop", (e) => {
			e.preventDefault();
			canvasArea.classList.remove("dragover");
			const files = e.dataTransfer.files;
			if (files.length > 0 && files[0].type.startsWith("image/")) {
				this.loadImage(files[0]);
			}
		});

		canvasArea.addEventListener("click", (e) => {
			if (!this.uploadedImage) {
				fileInput.click();
			}
		});
	}

	setupCollapsibleSections() {
		document.querySelectorAll(".section-toggle").forEach((toggle) => {
			toggle.addEventListener("click", () => {
				const content = toggle.nextElementSibling;
				const isExpanded = toggle.getAttribute("aria-expanded") === "true";
				toggle.setAttribute("aria-expanded", !isExpanded);
				content.classList.toggle("collapsed", isExpanded);
			});
		});
	}

	setupMobileSidebar() {
		const toggleBtn = document.querySelector(".sidebar-toggle-mobile");
		const sidebar = document.querySelector(".sidebar");
		if (!toggleBtn) return;

		const overlay = document.createElement("div");
		overlay.className = "sidebar-overlay";
		document.querySelector(".app-body").appendChild(overlay);

		const closeSidebar = () => {
			sidebar.classList.remove("open");
			overlay.classList.remove("active");
		};

		toggleBtn.addEventListener("click", () => {
			const isOpen = sidebar.classList.contains("open");
			if (isOpen) {
				closeSidebar();
			} else {
				sidebar.classList.add("open");
				overlay.classList.add("active");
			}
		});

		overlay.addEventListener("click", closeSidebar);
	}

	handleFileUpload(event) {
		const file = event.target.files[0];
		if (file && file.type.startsWith("image/")) {
			this.loadImage(file);
		}
	}

	loadImage(file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				this.uploadedImage = img;
				this.updateCanvasCursor();
				this.drawCanvas();
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
	}

	updateCanvasSize() {
		const sizeSelect = document.getElementById("canvasSize");
		const customInputs = document.getElementById("customSizeInputs");

		if (sizeSelect.value === "custom") {
			customInputs.style.display = "flex";
			const width = parseInt(document.getElementById("customWidth").value) || 1200;
			const height = parseInt(document.getElementById("customHeight").value) || 630;
			this.canvas.width = width;
			this.canvas.height = height;
		} else {
			customInputs.style.display = "none";
			const size = this.canvasSizes[sizeSelect.value];
			this.canvas.width = size.width;
			this.canvas.height = size.height;
		}
		// Invalidate offscreen cache on size change
		this._offscreen = null;
	}

	// ─── Offscreen canvas management ───

	getOffscreen() {
		const w = this.canvas.width;
		const h = this.canvas.height;
		if (!this._offscreen || this._offscreen.width !== w || this._offscreen.height !== h) {
			this._offscreen = document.createElement("canvas");
			this._offscreen.width = w;
			this._offscreen.height = h;
			this._offCtx = this._offscreen.getContext("2d");
		}
		return { canvas: this._offscreen, ctx: this._offCtx };
	}

	// ─── Drawing ───

	// Full quality render (used for sliders, final output)
	drawCanvas() {
		const { width, height } = this.canvas;

		this.ctx.clearRect(0, 0, width, height);

		if (!this.currentSettings.transparentBackground) {
			this.ctx.fillStyle = this.currentSettings.backgroundColor;
			this.ctx.fillRect(0, 0, width, height);
		}

		if (this.uploadedImage) {
			this.drawImage();
		} else {
			this.drawEmptyState();
		}

		// Depth of field: after image+grayscale, before grain+text
		if (this.currentSettings.dofIntensity > 0) {
			this.applyDepthOfFieldEffect();
		}

		if (this.currentSettings.grain > 0) {
			this.applyGrainEffect();
		}

		this.drawText();
	}

	// Lightweight render for drag interactions (skip grain)
	drawCanvasLight() {
		const { width, height } = this.canvas;

		this.ctx.clearRect(0, 0, width, height);

		if (!this.currentSettings.transparentBackground) {
			this.ctx.fillStyle = this.currentSettings.backgroundColor;
			this.ctx.fillRect(0, 0, width, height);
		}

		if (this.uploadedImage) {
			this.drawImage();
		} else {
			this.drawEmptyState();
		}

		if (this.currentSettings.dofIntensity > 0) {
			this.applyDepthOfFieldEffect();
		}

		// Skip grain during drag for performance
		this.drawText();
	}

	drawEmptyState() {
		const { width, height } = this.canvas;
		const fontSize = Math.max(16, Math.round(width / 40));
		this.ctx.save();
		this.ctx.fillStyle = "#444";
		this.ctx.font = `${fontSize}px 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace`;
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillText("Drop or tap to add an image", width / 2, height / 2);
		this.ctx.restore();
	}

	drawImage() {
		const { width: canvasWidth, height: canvasHeight } = this.canvas;
		const { width: imgWidth, height: imgHeight } = this.uploadedImage;

		const zoomFactor = this.currentSettings.zoom / 100;
		const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight) * zoomFactor;
		const scaledWidth = imgWidth * scale;
		const scaledHeight = imgHeight * scale;

		const x = (canvasWidth - scaledWidth) / 2 + this.currentSettings.imageX;
		const y = (canvasHeight - scaledHeight) / 2 + this.currentSettings.imageY;

		this.ctx.save();

		this.ctx.imageSmoothingEnabled = true;
		this.ctx.imageSmoothingQuality = "high";

		const skewXRad = (this.currentSettings.skewX * Math.PI) / 180;
		const skewYRad = (this.currentSettings.skewY * Math.PI) / 180;

		this.ctx.translate(canvasWidth / 2, canvasHeight / 2);
		this.ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);
		this.ctx.translate(-canvasWidth / 2, -canvasHeight / 2);

		this.ctx.globalAlpha = this.currentSettings.opacity / 100;

		// GPU-accelerated grayscale via canvas filter
		if (this.currentSettings.grayscale > 0) {
			this.ctx.filter = `grayscale(${this.currentSettings.grayscale}%)`;
		}

		this.ctx.drawImage(this.uploadedImage, x, y, scaledWidth, scaledHeight);

		// Reset filter
		this.ctx.filter = "none";

		this.ctx.restore();
	}

	applyDepthOfFieldEffect() {
		const blurRadius = this.currentSettings.dofIntensity;
		if (blurRadius <= 0) return;

		const w = this.canvas.width;
		const h = this.canvas.height;

		const { canvas: offscreen, ctx: offCtx } = this.getOffscreen();

		// Step 1: Draw blurred version of current canvas onto offscreen
		offCtx.clearRect(0, 0, w, h);
		offCtx.filter = `blur(${blurRadius}px)`;
		offCtx.drawImage(this.canvas, 0, 0);
		offCtx.filter = "none";

		// Step 2: Mask the blurred canvas — keep only the edges (outside focal area)
		// Use 'destination-in' with a radial gradient that's opaque at edges, transparent at center
		offCtx.save();
		offCtx.globalCompositeOperation = "destination-in";

		const focusX = (this.currentSettings.dofFocusX / 100) * w;
		const focusY = (this.currentSettings.dofFocusY / 100) * h;
		const radiusX = (this.currentSettings.dofSize / 100) * (w / 2);
		const radiusY = (this.currentSettings.dofSize / 100) * (h / 2);

		// We need: transparent center, opaque edges
		// 'destination-in' keeps destination where source alpha > 0
		// So we fill with opaque, then punch a transparent hole in the center
		// Easier: use 'destination-out' with an opaque-center gradient
		offCtx.globalCompositeOperation = "destination-out";

		// Draw elliptical gradient: opaque center fading to transparent edges
		// We use a scaled circle to create an ellipse
		offCtx.save();
		offCtx.translate(focusX, focusY);
		offCtx.scale(1, radiusY / radiusX);

		const grad = offCtx.createRadialGradient(0, 0, 0, 0, 0, radiusX * 1.6);
		grad.addColorStop(0, "rgba(0,0,0,1)");       // fully erase center (sharp shows through)
		grad.addColorStop(0.625, "rgba(0,0,0,1)");    // ~1.0/1.6 = sharp zone
		grad.addColorStop(1, "rgba(0,0,0,0)");         // transparent at edge = keep blur

		offCtx.fillStyle = grad;
		offCtx.fillRect(-w, -h * (radiusX / radiusY), w * 2, h * 2 * (radiusX / radiusY));
		offCtx.restore();

		offCtx.restore();

		// Step 3: Draw the masked blur on top of the sharp main canvas
		this.ctx.drawImage(offscreen, 0, 0);
	}

	applyGrainEffect() {
		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;

		try {
			const imageData = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
			const data = imageData.data;
			const grainIntensity = this.currentSettings.grain / 100;

			for (let i = 0; i < data.length; i += 4) {
				const grain = (Math.random() - 0.5) * grainIntensity * 100;
				data[i] = Math.max(0, Math.min(255, data[i] + grain));
				data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
				data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
			}

			this.ctx.putImageData(imageData, 0, 0);
		} catch (e) {
			console.warn("Could not apply grain effect:", e);
		}
	}

	drawText() {
		const { width: canvasWidth, height: canvasHeight } = this.canvas;
		const margin = 40;
		const lineHeight = 1.2;

		this.ctx.fillStyle = this.currentSettings.textColor;
		this.ctx.textAlign = this.currentSettings.textAlign;
		this.ctx.textBaseline = "bottom";

		let yPosition = canvasHeight - margin;

		const getXPosition = () => {
			if (this.currentSettings.textAlign === "right") {
				return canvasWidth - margin;
			}
			return margin;
		};

		if (this.currentSettings.bodyText.trim()) {
			this.ctx.font = `${this.currentSettings.bodySize}px 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace`;
			const bodyLines = this.wrapText(this.currentSettings.bodyText, canvasWidth - margin * 2, this.currentSettings.bodySize);

			for (let i = bodyLines.length - 1; i >= 0; i--) {
				this.ctx.fillText(bodyLines[i], getXPosition(), yPosition);
				yPosition -= this.currentSettings.bodySize * lineHeight;
			}

			yPosition -= 10;
		}

		if (this.currentSettings.titleText.trim()) {
			this.ctx.font = `bold ${this.currentSettings.titleSize}px 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace`;
			const titleLines = this.wrapText(this.currentSettings.titleText, canvasWidth - margin * 2, this.currentSettings.titleSize);

			for (let i = titleLines.length - 1; i >= 0; i--) {
				this.ctx.fillText(titleLines[i], getXPosition(), yPosition);
				yPosition -= this.currentSettings.titleSize * lineHeight;
			}
		}
	}

	wrapText(text, maxWidth, fontSize) {
		const words = text.split(" ");
		const lines = [];
		let currentLine = "";

		this.ctx.font = `${fontSize}px 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace`;

		for (let i = 0; i < words.length; i++) {
			const testLine = currentLine + words[i] + " ";
			const metrics = this.ctx.measureText(testLine);

			if (metrics.width > maxWidth && currentLine) {
				lines.push(currentLine.trim());
				currentLine = words[i] + " ";
			} else {
				currentLine = testLine;
			}
		}

		if (currentLine) {
			lines.push(currentLine.trim());
		}

		return lines;
	}

	resetAll() {
		this.currentSettings = {
			canvasSize: "opengraph",
			skewX: 5,
			skewY: 5.5,
			grayscale: 100,
			zoom: 100,
			opacity: 100,
			grain: 0,
			dofIntensity: 0,
			dofSize: 50,
			dofFocusX: 50,
			dofFocusY: 50,
			titleText: "",
			bodyText: "",
			textColor: "#ffffff",
			textAlign: "left",
			titleSize: 48,
			bodySize: 24,
			imageX: 0,
			imageY: 0,
			backgroundColor: "#2a2a2a",
			transparentBackground: false,
		};

		this.uploadedImage = null;

		document.getElementById("canvasSize").value = "opengraph";
		document.getElementById("skewX").value = 5;
		document.getElementById("skewY").value = 5.5;
		document.getElementById("grayscale").value = 100;
		document.getElementById("zoom").value = 100;
		document.getElementById("opacity").value = 100;
		document.getElementById("grain").value = 0;
		document.getElementById("dofIntensity").value = 0;
		document.getElementById("dofSize").value = 50;
		document.getElementById("dofFocusX").value = 50;
		document.getElementById("dofFocusY").value = 50;
		document.getElementById("titleText").value = "";
		document.getElementById("bodyText").value = "";
		document.getElementById("textColor").value = "#ffffff";
		document.getElementById("textAlign").value = "left";
		document.getElementById("titleSize").value = 48;
		document.getElementById("bodySize").value = 24;
		document.getElementById("imageUpload").value = "";
		document.getElementById("backgroundColor").value = "#2a2a2a";
		document.getElementById("transparentBackground").checked = false;

		document.getElementById("skewXValue").textContent = "5°";
		document.getElementById("skewYValue").textContent = "5.5°";
		document.getElementById("grayscaleValue").textContent = "100%";
		document.getElementById("zoomValue").textContent = "100%";
		document.getElementById("opacityValue").textContent = "100%";
		document.getElementById("grainValue").textContent = "0%";
		document.getElementById("dofIntensityValue").textContent = "0px";
		document.getElementById("dofSizeValue").textContent = "50%";
		document.getElementById("dofFocusXValue").textContent = "50%";
		document.getElementById("dofFocusYValue").textContent = "50%";
		document.getElementById("titleSizeValue").textContent = "48px";
		document.getElementById("bodySizeValue").textContent = "24px";

		this.updateCanvasSize();
		this.updateCanvasCursor();
		this.drawCanvas();
		this.saveSettings();
	}

	resetImagePosition() {
		this.currentSettings.imageX = 0;
		this.currentSettings.imageY = 0;
		this.drawCanvas();
		this.debouncedSave();
	}

	downloadImage() {
		// Force a full-quality render before export
		this.drawCanvas();

		const link = document.createElement("a");
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `social-media-image-${timestamp}.png`;

		link.download = filename;
		link.href = this.canvas.toDataURL("image/png");

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	saveSettings() {
		localStorage.setItem("socialMediaImageSettings", JSON.stringify(this.currentSettings));
	}

	loadSettings() {
		const saved = localStorage.getItem("socialMediaImageSettings");
		if (saved) {
			try {
				const settings = JSON.parse(saved);
				this.currentSettings = { ...this.currentSettings, ...settings };
				this.applySettingsToUI();
			} catch (e) {
				console.warn("Could not load saved settings:", e);
			}
		}
	}

	applySettingsToUI() {
		document.getElementById("canvasSize").value = this.currentSettings.canvasSize;
		document.getElementById("skewX").value = this.currentSettings.skewX;
		document.getElementById("skewY").value = this.currentSettings.skewY;
		document.getElementById("grayscale").value = this.currentSettings.grayscale;
		document.getElementById("zoom").value = this.currentSettings.zoom;
		document.getElementById("opacity").value = this.currentSettings.opacity;
		document.getElementById("grain").value = this.currentSettings.grain;
		document.getElementById("dofIntensity").value = this.currentSettings.dofIntensity;
		document.getElementById("dofSize").value = this.currentSettings.dofSize;
		document.getElementById("dofFocusX").value = this.currentSettings.dofFocusX;
		document.getElementById("dofFocusY").value = this.currentSettings.dofFocusY;
		document.getElementById("titleText").value = this.currentSettings.titleText;
		document.getElementById("bodyText").value = this.currentSettings.bodyText;
		document.getElementById("textColor").value = this.currentSettings.textColor;
		document.getElementById("textAlign").value = this.currentSettings.textAlign;
		document.getElementById("titleSize").value = this.currentSettings.titleSize;
		document.getElementById("bodySize").value = this.currentSettings.bodySize;
		document.getElementById("backgroundColor").value = this.currentSettings.backgroundColor;
		document.getElementById("transparentBackground").checked = this.currentSettings.transparentBackground;

		document.getElementById("skewXValue").textContent = `${this.currentSettings.skewX}°`;
		document.getElementById("skewYValue").textContent = `${this.currentSettings.skewY}°`;
		document.getElementById("grayscaleValue").textContent = `${this.currentSettings.grayscale}%`;
		document.getElementById("zoomValue").textContent = `${this.currentSettings.zoom}%`;
		document.getElementById("opacityValue").textContent = `${this.currentSettings.opacity}%`;
		document.getElementById("grainValue").textContent = `${this.currentSettings.grain}%`;
		document.getElementById("dofIntensityValue").textContent = `${this.currentSettings.dofIntensity}px`;
		document.getElementById("dofSizeValue").textContent = `${this.currentSettings.dofSize}%`;
		document.getElementById("dofFocusXValue").textContent = `${this.currentSettings.dofFocusX}%`;
		document.getElementById("dofFocusYValue").textContent = `${this.currentSettings.dofFocusY}%`;
		document.getElementById("titleSizeValue").textContent = `${this.currentSettings.titleSize}px`;
		document.getElementById("bodySizeValue").textContent = `${this.currentSettings.bodySize}px`;
	}

	setupCanvasDragEvents() {
		this.canvas.addEventListener("mousedown", (e) => this.startDrag(e));
		this.canvas.addEventListener("mousemove", (e) => this.drag(e));
		this.canvas.addEventListener("mouseup", () => this.endDrag());
		this.canvas.addEventListener("mouseleave", () => this.endDrag());

		this.canvas.addEventListener("touchstart", (e) => {
			e.preventDefault();
			const touch = e.touches[0];
			const mouseEvent = new MouseEvent("mousedown", {
				clientX: touch.clientX,
				clientY: touch.clientY,
			});
			this.startDrag(mouseEvent);
		});

		this.canvas.addEventListener("touchmove", (e) => {
			e.preventDefault();
			const touch = e.touches[0];
			const mouseEvent = new MouseEvent("mousemove", {
				clientX: touch.clientX,
				clientY: touch.clientY,
			});
			this.drag(mouseEvent);
		});

		this.canvas.addEventListener("touchend", (e) => {
			e.preventDefault();
			this.endDrag();
		});

		this.updateCanvasCursor();
	}

	updateCanvasCursor() {
		if (this.uploadedImage) {
			this.canvas.style.cursor = "grab";
		} else {
			this.canvas.style.cursor = "pointer";
		}
	}

	startDrag(e) {
		if (!this.uploadedImage) return;

		this.isDragging = true;
		this.canvas.style.cursor = "grabbing";

		const rect = this.canvas.getBoundingClientRect();
		this.lastMousePos = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
	}

	drag(e) {
		if (!this.isDragging || !this.uploadedImage) return;

		const rect = this.canvas.getBoundingClientRect();
		const currentMousePos = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};

		const deltaX = currentMousePos.x - this.lastMousePos.x;
		const deltaY = currentMousePos.y - this.lastMousePos.y;

		this.currentSettings.imageX += deltaX;
		this.currentSettings.imageY += deltaY;

		this.lastMousePos = currentMousePos;

		// Lightweight render during drag (skip grain)
		this.requestDraw(false);
		this.debouncedSave();
	}

	endDrag() {
		if (this.isDragging) {
			this.isDragging = false;
			if (this.uploadedImage) {
				this.canvas.style.cursor = "grab";
			}
			// Full quality render on release
			this.drawCanvas();
			this.debouncedSave();
		}
	}
}

document.addEventListener("DOMContentLoaded", () => {
	new SocialMediaImageCreator();
});
