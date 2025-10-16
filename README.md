# `imagetrace`

A simple TypeScript library for converting raster images to vector graphics, given the set of colours to trace for.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)

## Features

-   🔄 Raster to vector conversion
-   🎯 Color-based region detection
-   🎨 Blob detection algorithm
-   🔍 Point visualization option
-   💪 Written in TypeScript with full type safety

## Installation

```bash
npm install imagetrace
```

## Quick Start

```typescript
import { ImageTrace } from 'imagetrace';

// Define your color palette
const palette = [
	{ r: 255, g: 0, b: 0 }, // rednpm.cmd buu
	{ r: 0, g: 0, b: 255 }, // blue
];

// Configure the tracer
const options = {
	chaikinSmoothingSteps: 5,
	smoothingMinLength: 5,
	pixelGridStepSize: 1,
	debugPointRadius: 0.5,
};

// Create a new tracer instance
const tracer = new ImageTrace(imageData, palette, options);

// Get SVG output
const svg = tracer.getSVGString();
```

## API Reference

### ImageTrace

Main class for converting raster images to vector graphics.

```typescript
new ImageTrace(
    imageData: ImageDataLike,
    palette: Color[],
    options: ImageTraceOptions
)
```

#### Options

| Option                | Type   | Default   | Description                          |
| --------------------- | ------ | --------- | ------------------------------------ |
| smoothingMinLength    | number | -         | Minimum length for path smoothing    |
| chaikinSmoothingSteps | number | -         | Number of smoothing iterations       |
| pixelGridStepSize     | number | 1         | Pixel sampling interval              |
| debugPointRadius      | number | undefined | Radius for debug point visualization |

## Development

### Prerequisites

-   Node.js 14+
-   npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/aidanwyber/imagetrace.git

# Install dependencies
cd imagetrace
npm install

# Run tests
npm test
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Examples

### Basic Usage

```typescript
import { ImageTrace } from 'imagetrace';

// Load your image data
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, width, height);

// Create tracer instance
const tracer = new ImageTrace(imageData, [{ r: 255, g: 0, b: 0 }], {
	smoothingMinLength: 5,
	chaikinSmoothingSteps: 5,
});

// Get SVG output
const svg = tracer.getSVGString();
```

## Credits

This project builds upon several excellent works:

-   Blob detection algorithm inspired by Jeff Thompson's work:
    -   [CP2: Blob Detection – Webcam Tracking in p5.js](https://www.youtube.com/watch?v=G7u26vfiUX8)
    -   [Original p5.js implementation](https://editor.p5js.org/jeffThompson/sketches/rFeSWevtU)
    -   More at [jeffreythompson.org](http://jeffreythompson.org)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Performance Notes

-   Processing time varies with image size and complexity
-   For optimal performance, consider:
    -   Adjusting `pixelGridStepSize` for larger images
    -   Tuning `smoothingMinLength` based on image size
    -   Running locally rather than in web-based environments

## Support

-   Create an issue in the GitHub repository
-   Contact the maintainers at [email]

## Roadmap

-   [ ] WebAssembly optimization
-   [ ] Additional color space support
-   [ ] Browser extension
-   [ ] Real-time video processing
-   [ ] Additional export formats
