import { loadImage, createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { ImageTracer } from '../src/ImageTracer';

test('creates correct number of hulls', async () => {
	const image = await loadImage('test/test-128.png'); // path relative to test file
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0);
	const imageData = ctx.getImageData(0, 0, image.width, image.height);

	const palette = [
		{ r: 255, g: 0, b: 0 },
		{ r: 0, g: 0, b: 255 },
	];

	const it = new ImageTracer(imageData, palette, 1);

	console.log(it.hulls[0]);

	expect(it.hulls.length).toBe(2);
});

test('writes an SVG file', async () => {
	const image = await loadImage('test/test-128.png'); // path relative to test file
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0);
	const imageData = ctx.getImageData(0, 0, image.width, image.height);

	const palette = [
		{ r: 255, g: 0, b: 0 },
		{ r: 0, g: 0, b: 255 },
	];

	const it = new ImageTracer(imageData, palette, 1);

	const svgString = it.getSVGString();

	// Create an output directory
	const outDir = path.join(__dirname, 'output');
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

	// Write the SVG to disk
	const svgPath = path.join(outDir, 'test-128.svg');
	fs.writeFileSync(svgPath, svgString, 'utf8');

	// Assert the file exists and contains valid content
	const contents = fs.readFileSync(svgPath, 'utf8');
	expect(contents).toContain('<svg');
});
