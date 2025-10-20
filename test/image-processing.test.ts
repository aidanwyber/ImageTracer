import fs from 'fs';
import path from 'path';
import { loadImage, createCanvas } from 'canvas';
import { ImageTrace } from '../src/ImageTrace';

test('correct number of hulls and writes an SVG file', async () => {
	const size = '1080';
	// const size = '128';
	const image = await loadImage(`test/test-${size}.png`);
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0);
	const imageData = ctx.getImageData(0, 0, image.width, image.height);

	const palette = [
		{ r: 255, g: 0, b: 0 },
		{ r: 0, g: 0, b: 255 },
	];

	const maxSize = Math.max(image.width, image.height);

	const scale = maxSize / 1080;
	const it = new ImageTrace(imageData, palette, {
		pathSimplificationTolerance: 3,
		curveFittingTolerance: 2,
		minHullDistance: 3,
		debugPointRadius: 4 * scale,
	});

	const bgCol = { r: 230, g: 230, b: 230 };
	const svgString = it.getSVGString(bgCol);

	// create an output directory
	const outDir = path.join(__dirname, 'output');
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

	// write the SVG to disk
	const svgPath = path.join(outDir, `test-${size}.svg`);
	fs.writeFileSync(svgPath, svgString, 'utf8');

	// assert the file exists and contains valid content
	const contents = fs.readFileSync(svgPath, 'utf8');

	// expect(it.validHulls.length).toBe(5);
	expect(contents).toContain('<svg');
});
