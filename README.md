# Screenshooter

A simple, client-side web application for creating social media images with text overlays. Perfect for creating OpenGraph images, Twitter banners, and other social media graphics.

This app was written entirely by Claude Sonnet 4, with zero manual intervention.

## Features

- **Image Upload**: Upload screenshots or photos via click or drag-and-drop
- **Canvas Sizes**: Pre-configured sizes for:
  - Twitter Banner (1500x500)
  - Twitter Timeline (1200x675)
  - OpenGraph (1200x630)
  - Custom dimensions
- **Image Effects**:
  - Skew transformation (X and Y axes)
  - Grayscale filter with adjustable intensity
- **Text Overlays**:
  - Title text (bottom-left positioning)
  - Body text (underneath title)
  - Customizable text color and sizes
  - Automatic text wrapping
  - Text shadow for better readability
- **Export**: Download as PNG
- **Persistence**: Settings saved to localStorage

## Usage

1. Open `index.html` in your web browser
2. Upload an image by clicking or dragging into the upload area
3. Select your desired canvas size from the dropdown
4. Adjust image effects using the sliders:
   - Skew X/Y: Transform the image perspective
   - Grayscale: Convert to grayscale (0-100%)
5. Add text overlays:
   - Enter title and/or body text
   - Adjust text color and sizes
6. Click "Download Image" to save as PNG

## Technical Details

- **Pure HTML/CSS/JavaScript**: No build step required
- **Client-side only**: Everything runs in the browser
- **Canvas API**: Uses HTML5 Canvas for image manipulation
- **localStorage**: Saves your settings between sessions
- **Responsive Design**: Works on desktop and mobile

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and responsive design
- `script.js` - Application logic and canvas manipulation

## Browser Support

Works in all modern browsers that support:
- HTML5 Canvas
- File API
- localStorage
- CSS Grid

## License

MIT License - feel free to use and modify for your projects!
