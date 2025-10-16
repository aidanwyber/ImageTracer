import fs from 'fs';
import path from 'path';
import { loadImage, createCanvas } from 'canvas';
import { ImageTracer } from '../src/ImageTracer';

test('correct number of hulls and writes an SVG file', async () => {
	const size = '1080';
	// const size = '128';
	const image = await loadImage(`test/test-${size}.png`);
	// const image = await loadImage('test/test-1080.png');
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0);
	const imageData = ctx.getImageData(0, 0, image.width, image.height);

	const palette = [
		{ r: 255, g: 0, b: 0 },
		{ r: 0, g: 0, b: 255 },
	];

	const maxSize = Math.max(image.width, image.height);

	const it = new ImageTracer(imageData, palette, {
		chaikinSmoothingSteps: 5,
		smoothingMinLength: (5 * maxSize) / 128,
		debugPointRadius: (0.5 * maxSize) / 128,
	});

	const svgString = it.getSVGString();

	// create an output directory
	const outDir = path.join(__dirname, 'output');
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

	// write the SVG to disk
	const svgPath = path.join(outDir, `test-${size}.svg`);
	fs.writeFileSync(svgPath, svgString, 'utf8');

	// assert the file exists and contains valid content
	const contents = fs.readFileSync(svgPath, 'utf8');

	expect(it.hulls.length).toBe(2);
	expect(contents).toContain('<svg');
});
