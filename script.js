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
			titleText: "",
			bodyText: "",
			textColor: "#ffffff",
			titleSize: 48,
			bodySize: 24,
			imageX: 0,
			imageY: 0,
		};

		this.canvasSizes = {
			"twitter-banner": { width: 1500, height: 500 },
			"twitter-timeline": { width: 1200, height: 675 },
			opengraph: { width: 1200, height: 630 },
			custom: { width: 1200, height: 630 },
		};

		// Drag state
		this.isDragging = false;
		this.lastMousePos = { x: 0, y: 0 };

		this.init();
		this.loadSettings();
	}

	init() {
		this.setupEventListeners();
		this.updateCanvasSize();
		this.drawCanvas();
	}

	setupEventListeners() {
		// File upload
		const fileInput = document.getElementById("imageUpload");
		const uploadLabel = document.querySelector(".upload-label");

		fileInput.addEventListener("change", (e) => this.handleFileUpload(e));

		// Drag and drop
		uploadLabel.addEventListener("dragover", (e) => {
			e.preventDefault();
			uploadLabel.classList.add("dragover");
		});

		uploadLabel.addEventListener("dragleave", () => {
			uploadLabel.classList.remove("dragover");
		});

		uploadLabel.addEventListener("drop", (e) => {
			e.preventDefault();
			uploadLabel.classList.remove("dragover");

			const files = e.dataTransfer.files;
			if (files.length > 0 && files[0].type.startsWith("image/")) {
				this.loadImage(files[0]);
			}
		});

		// Canvas size controls
		document.getElementById("canvasSize").addEventListener("change", (e) => {
			this.currentSettings.canvasSize = e.target.value;
			this.updateCanvasSize();
			this.drawCanvas();
			this.saveSettings();
		});

		// Custom size inputs
		document.getElementById("customWidth").addEventListener("input", () => {
			if (this.currentSettings.canvasSize === "custom") {
				this.updateCanvasSize();
				this.drawCanvas();
			}
		});

		document.getElementById("customHeight").addEventListener("input", () => {
			if (this.currentSettings.canvasSize === "custom") {
				this.updateCanvasSize();
				this.drawCanvas();
			}
		});

		// Effect controls
		document.getElementById("skewX").addEventListener("input", (e) => {
			this.currentSettings.skewX = parseFloat(e.target.value);
			document.getElementById("skewXValue").textContent = `${e.target.value}°`;
			this.drawCanvas();
			this.saveSettings();
		});

		document.getElementById("skewY").addEventListener("input", (e) => {
			this.currentSettings.skewY = parseFloat(e.target.value);
			document.getElementById("skewYValue").textContent = `${e.target.value}°`;
			this.drawCanvas();
			this.saveSettings();
		});

		document.getElementById("grayscale").addEventListener("input", (e) => {
			this.currentSettings.grayscale = parseInt(e.target.value);
			document.getElementById("grayscaleValue").textContent = `${e.target.value}%`;
			this.drawCanvas();
			this.saveSettings();
		});

		document.getElementById("zoom").addEventListener("input", (e) => {
			this.currentSettings.zoom = parseInt(e.target.value);
			document.getElementById("zoomValue").textContent = `${e.target.value}%`;
			this.drawCanvas();
			this.saveSettings();
		});

		document.getElementById("opacity").addEventListener("input", (e) => {
			this.currentSettings.opacity = parseInt(e.target.value);
			document.getElementById("opacityValue").textContent = `${e.target.value}%`;
			this.drawCanvas();
			this.saveSettings();
		});

		document.getElementById("grain").addEventListener("input", (e) => {
			this.currentSettings.grain = parseInt(e.target.value);
			document.getElementById("grainValue").textContent = `${e.target.value}%`;
			this.drawCanvas();
			this.saveSettings();
		});

		// Text controls
		document.getElementById("titleText").addEventListener("input", (e) => {
			this.currentSettings.titleText = e.target.value;
			this.drawCanvas();
			this.saveSettings();
		});

		document.getElementById("bodyText").addEventListener("input", (e) => {
			this.currentSettings.bodyText = e.target.value;
			this.drawCanvas();
			this.saveSettings();
		});

		document.getElementById("textColor").addEventListener("input", (e) => {
			this.currentSettings.textColor = e.target.value;
			this.drawCanvas();
			this.saveSettings();
		});

		document.getElementById("titleSize").addEventListener("input", (e) => {
			this.currentSettings.titleSize = parseInt(e.target.value);
			document.getElementById("titleSizeValue").textContent = `${e.target.value}px`;
			this.drawCanvas();
			this.saveSettings();
		});

		document.getElementById("bodySize").addEventListener("input", (e) => {
			this.currentSettings.bodySize = parseInt(e.target.value);
			document.getElementById("bodySizeValue").textContent = `${e.target.value}px`;
			this.drawCanvas();
			this.saveSettings();
		});

		// Action buttons
		document.getElementById("resetBtn").addEventListener("click", () => this.resetAll());
		document.getElementById("resetPositionBtn").addEventListener("click", () => this.resetImagePosition());
		document.getElementById("downloadBtn").addEventListener("click", () => this.downloadImage());

		// Canvas drag events for repositioning image
		this.setupCanvasDragEvents();
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
	}

	drawCanvas() {
		const { width, height } = this.canvas;

		// Clear canvas
		this.ctx.clearRect(0, 0, width, height);

		// Set background
		this.ctx.fillStyle = "#2a2a2a";
		this.ctx.fillRect(0, 0, width, height);

		if (this.uploadedImage) {
			this.drawImage();
		}

		this.drawText();
	}

	drawImage() {
		const { width: canvasWidth, height: canvasHeight } = this.canvas;
		const { width: imgWidth, height: imgHeight } = this.uploadedImage;

		// Calculate scaling based on zoom to cover entire canvas
		const zoomFactor = this.currentSettings.zoom / 100;
		const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight) * zoomFactor;
		const scaledWidth = imgWidth * scale;
		const scaledHeight = imgHeight * scale;

		// Center the image and apply position offsets
		const x = (canvasWidth - scaledWidth) / 2 + this.currentSettings.imageX;
		const y = (canvasHeight - scaledHeight) / 2 + this.currentSettings.imageY;

		// Save context for transformations
		this.ctx.save();

		// Enable antialiasing for smoother rendering
		this.ctx.imageSmoothingEnabled = true;
		this.ctx.imageSmoothingQuality = "high";

		// Apply skew transformation
		const skewXRad = (this.currentSettings.skewX * Math.PI) / 180;
		const skewYRad = (this.currentSettings.skewY * Math.PI) / 180;

		// Move to center for transformation
		this.ctx.translate(canvasWidth / 2, canvasHeight / 2);
		this.ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);
		this.ctx.translate(-canvasWidth / 2, -canvasHeight / 2);

		// Apply opacity
		this.ctx.globalAlpha = this.currentSettings.opacity / 100;

		// Draw the image
		this.ctx.drawImage(this.uploadedImage, x, y, scaledWidth, scaledHeight);

		// Apply grayscale and grain effects if enabled
		if (this.currentSettings.grayscale > 0 || this.currentSettings.grain > 0) {
			this.applyImageEffects(x, y, scaledWidth, scaledHeight);
		}

		// Restore context
		this.ctx.restore();
	}

	applyImageEffects(x, y, width, height) {
		// Ensure coordinates are integers and within bounds
		x = Math.floor(x);
		y = Math.floor(y);
		width = Math.floor(width);
		height = Math.floor(height);

		// Clamp to canvas bounds
		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;
		
		if (x < 0) {
			width += x;
			x = 0;
		}
		if (y < 0) {
			height += y;
			y = 0;
		}
		if (x + width > canvasWidth) {
			width = canvasWidth - x;
		}
		if (y + height > canvasHeight) {
			height = canvasHeight - y;
		}

		// Skip if dimensions are invalid
		if (width <= 0 || height <= 0) return;

		try {
			// Get image data for the area where the image is drawn
			const imageData = this.ctx.getImageData(x, y, width, height);
			const data = imageData.data;

			const grayscaleIntensity = this.currentSettings.grayscale / 100;
			const grainIntensity = this.currentSettings.grain / 100;

			// Apply effects pixel by pixel
			for (let i = 0; i < data.length; i += 4) {
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];
				
				// Apply grayscale effect
				if (this.currentSettings.grayscale > 0) {
					// Using luminance formula for better grayscale conversion
					const gray = 0.299 * r + 0.587 * g + 0.114 * b;
					
					// Blend between original color and grayscale based on intensity
					data[i] = r + (gray - r) * grayscaleIntensity;     // Red
					data[i + 1] = g + (gray - g) * grayscaleIntensity; // Green
					data[i + 2] = b + (gray - b) * grayscaleIntensity; // Blue
				}

				// Apply grain effect
				if (this.currentSettings.grain > 0) {
					// Generate random grain value
					const grain = (Math.random() - 0.5) * grainIntensity * 100;

					// Apply grain to RGB channels
					data[i] = Math.max(0, Math.min(255, data[i] + grain));     // Red
					data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain)); // Green
					data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain)); // Blue
				}
				
				// Alpha channel (data[i + 3]) remains unchanged
			}

			// Put the modified image data back
			this.ctx.putImageData(imageData, x, y);
		} catch (e) {
			console.warn("Could not apply image effects:", e);
		}
	}

	drawText() {
		const { width: canvasWidth, height: canvasHeight } = this.canvas;
		const margin = 40;
		const lineHeight = 1.2;

		this.ctx.fillStyle = this.currentSettings.textColor;
		this.ctx.textAlign = "left";
		this.ctx.textBaseline = "bottom";

		let yPosition = canvasHeight - margin;

		// Draw body text first (it goes underneath the title)
		if (this.currentSettings.bodyText.trim()) {
			this.ctx.font = `${this.currentSettings.bodySize}px 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace`;

			const bodyLines = this.wrapText(this.currentSettings.bodyText, canvasWidth - margin * 2, this.currentSettings.bodySize);

			// Draw body text lines from bottom up
			for (let i = bodyLines.length - 1; i >= 0; i--) {
				this.ctx.fillText(bodyLines[i], margin, yPosition);
				yPosition -= this.currentSettings.bodySize * lineHeight;
			}

			// Add space between body and title
			yPosition -= 10;
		}

		// Draw title text
		if (this.currentSettings.titleText.trim()) {
			this.ctx.font = `bold ${this.currentSettings.titleSize}px 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace`;

			const titleLines = this.wrapText(this.currentSettings.titleText, canvasWidth - margin * 2, this.currentSettings.titleSize);

			// Draw title lines from bottom up
			for (let i = titleLines.length - 1; i >= 0; i--) {
				this.ctx.fillText(titleLines[i], margin, yPosition);
				yPosition -= this.currentSettings.titleSize * lineHeight;
			}
		}
	}

	wrapText(text, maxWidth, fontSize) {
		const words = text.split(" ");
		const lines = [];
		let currentLine = "";

		// Set font for measurement
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
			titleText: "",
			bodyText: "",
			textColor: "#ffffff",
			titleSize: 48,
			bodySize: 24,
			imageX: 0,
			imageY: 0,
		};

		this.uploadedImage = null;

		// Reset UI elements
		document.getElementById("canvasSize").value = "opengraph";
		document.getElementById("skewX").value = 5;
		document.getElementById("skewY").value = 5.5;
		document.getElementById("grayscale").value = 100;
		document.getElementById("zoom").value = 100;
		document.getElementById("opacity").value = 100;
		document.getElementById("grain").value = 0;
		document.getElementById("titleText").value = "";
		document.getElementById("bodyText").value = "";
		document.getElementById("textColor").value = "#ffffff";
		document.getElementById("titleSize").value = 48;
		document.getElementById("bodySize").value = 24;
		document.getElementById("imageUpload").value = "";

		// Reset value displays
		document.getElementById("skewXValue").textContent = "5°";
		document.getElementById("skewYValue").textContent = "5.5°";
		document.getElementById("grayscaleValue").textContent = "100%";
		document.getElementById("zoomValue").textContent = "100%";
		document.getElementById("opacityValue").textContent = "100%";
		document.getElementById("grainValue").textContent = "0%";
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
		this.saveSettings();
	}

	downloadImage() {
		// Create a temporary link element
		const link = document.createElement("a");

		// Generate filename with timestamp
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `social-media-image-${timestamp}.png`;

		// Set the download attributes
		link.download = filename;
		link.href = this.canvas.toDataURL("image/png");

		// Trigger download
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
		document.getElementById("titleText").value = this.currentSettings.titleText;
		document.getElementById("bodyText").value = this.currentSettings.bodyText;
		document.getElementById("textColor").value = this.currentSettings.textColor;
		document.getElementById("titleSize").value = this.currentSettings.titleSize;
		document.getElementById("bodySize").value = this.currentSettings.bodySize;

		// Update value displays
		document.getElementById("skewXValue").textContent = `${this.currentSettings.skewX}°`;
		document.getElementById("skewYValue").textContent = `${this.currentSettings.skewY}°`;
		document.getElementById("grayscaleValue").textContent = `${this.currentSettings.grayscale}%`;
		document.getElementById("zoomValue").textContent = `${this.currentSettings.zoom}%`;
		document.getElementById("opacityValue").textContent = `${this.currentSettings.opacity}%`;
		document.getElementById("grainValue").textContent = `${this.currentSettings.grain}%`;
		document.getElementById("titleSizeValue").textContent = `${this.currentSettings.titleSize}px`;
		document.getElementById("bodySizeValue").textContent = `${this.currentSettings.bodySize}px`;
	}

	setupCanvasDragEvents() {
		// Mouse events
		this.canvas.addEventListener("mousedown", (e) => this.startDrag(e));
		this.canvas.addEventListener("mousemove", (e) => this.drag(e));
		this.canvas.addEventListener("mouseup", () => this.endDrag());
		this.canvas.addEventListener("mouseleave", () => this.endDrag());

		// Touch events for mobile
		this.canvas.addEventListener("touchstart", (e) => {
			e.preventDefault();
			const touch = e.touches[0];
			const mouseEvent = new MouseEvent("mousedown", {
				clientX: touch.clientX,
				clientY: touch.clientY
			});
			this.startDrag(mouseEvent);
		});

		this.canvas.addEventListener("touchmove", (e) => {
			e.preventDefault();
			const touch = e.touches[0];
			const mouseEvent = new MouseEvent("mousemove", {
				clientX: touch.clientX,
				clientY: touch.clientY
			});
			this.drag(mouseEvent);
		});

		this.canvas.addEventListener("touchend", (e) => {
			e.preventDefault();
			this.endDrag();
		});

		// Set canvas cursor style
		this.updateCanvasCursor();
	}

	updateCanvasCursor() {
		if (this.uploadedImage) {
			this.canvas.style.cursor = "grab";
		} else {
			this.canvas.style.cursor = "default";
		}
	}

	startDrag(e) {
		if (!this.uploadedImage) return;

		this.isDragging = true;
		this.canvas.style.cursor = "grabbing";

		const rect = this.canvas.getBoundingClientRect();
		this.lastMousePos = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}

	drag(e) {
		if (!this.isDragging || !this.uploadedImage) return;

		const rect = this.canvas.getBoundingClientRect();
		const currentMousePos = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};

		// Calculate the delta movement
		const deltaX = currentMousePos.x - this.lastMousePos.x;
		const deltaY = currentMousePos.y - this.lastMousePos.y;

		// Update image position
		this.currentSettings.imageX += deltaX;
		this.currentSettings.imageY += deltaY;

		// Update last mouse position
		this.lastMousePos = currentMousePos;

		// Redraw canvas
		this.drawCanvas();
		this.saveSettings();
	}

	endDrag() {
		this.isDragging = false;
		this.canvas.style.cursor = "grab";
	}

	// ...existing code...
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	new SocialMediaImageCreator();
});
