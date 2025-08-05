# 3D Card Generator

A modern Angular application that creates 3D cards from front and back images using Three.js and NG-ZORRO UI components.

## Features

- **3D Card Generation**: Upload front and back images to create a realistic 3D card
- **Real-time Preview**: See your 3D card rotating in real-time with smooth animations
- **GLB Export**: Export your 3D card as a GLB file for use in other 3D applications
- **Modern UI**: Beautiful dark theme interface built with NG-ZORRO components
- **Responsive Design**: Works on desktop and mobile devices
- **Drag & Drop**: Easy file upload with drag and drop support

## Technologies Used

- **Angular 19**: Modern frontend framework
- **Three.js**: 3D graphics library for WebGL rendering
- **NG-ZORRO**: Enterprise UI component library for Angular
- **TypeScript**: Type-safe JavaScript
- **GLTFExporter**: For exporting 3D models in GLB format

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 3dCardCreator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:4200`

## How to Use

1. **Upload Images**: 
   - Click "Browse..." next to "Front Image" to upload the front side of your card
   - Click "Browse..." next to "Back Image" to upload the back side of your card
   - Supported formats: JPG, PNG, GIF, WebP

2. **Preview**: 
   - The 3D card will automatically appear in the preview area
   - The card rotates continuously to show both sides
   - You can see the textures applied to the front and back faces

3. **Export**: 
   - Click the "EXPORT GLB" button to download your 3D card
   - The file will be saved as `3d-card.glb`
   - You can use this file in other 3D applications like Blender, Unity, or Three.js projects

## Project Structure

```
src/
├── app/
│   ├── app.component.ts      # Main component with 3D logic
│   ├── app.component.html    # UI template
│   ├── app.component.css     # Component styles
│   ├── app.config.ts         # Angular configuration
│   └── app.routes.ts         # Routing configuration
├── styles.css                # Global styles
└── main.ts                   # Application entry point
```

## Key Features Explained

### 3D Card Creation
- Uses Three.js BoxGeometry to create a card with realistic proportions
- Standard credit card dimensions (85.6mm x 53.98mm)
- Multiple materials for front, back, and side faces
- Automatic texture mapping from uploaded images

### Real-time Rendering
- WebGL renderer with antialiasing
- Ambient and directional lighting for realistic appearance
- Shadow mapping for depth
- Continuous rotation animation

### File Export
- GLB format export using Three.js GLTFExporter
- Binary format for efficient file size
- Compatible with most 3D applications and game engines

## Customization

### Card Dimensions
You can modify the card dimensions in `app.component.ts`:
```typescript
const cardWidth = 3.4;    // Width in Three.js units
const cardHeight = 2.1;   // Height in Three.js units
const cardThickness = 0.1; // Thickness in Three.js units
```

### Styling
The application uses a dark theme with custom NG-ZORRO overrides. You can modify the colors and styling in:
- `src/app/app.component.css` - Component-specific styles
- `src/styles.css` - Global styles and NG-ZORRO overrides

### Animation Speed
Adjust the rotation speed by modifying the animation loop in `app.component.ts`:
```typescript
this.card.rotation.y += 0.01; // Increase for faster rotation
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Common Issues

1. **3D scene not loading**: Ensure WebGL is supported in your browser
2. **File upload not working**: Check that the file is an image format
3. **Export fails**: Make sure you have at least one image uploaded

### Performance Tips

- Use optimized images (recommended size: 512x512 pixels)
- Close other browser tabs to free up GPU memory
- Use modern browsers for best performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [NG-ZORRO](https://ng.ant.design/) - Angular UI component library
- [Ant Design](https://ant.design/) - Design system

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
