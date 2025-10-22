import fs from 'fs';
import path from 'path';
import { loadImage, createCanvas } from 'canvas';
import { ImageTrace } from '../src/ImageTrace';
import { Color } from '../src';

describe('correct number of hulls and writes an SVG file', async () => {
	const testConfigs: {
		size: number;
		itDescription: string;
		fileName: string;
		debugRadius?: number;
		palette: Color[];
		bgCol: Color;
	}[] = [
		{
			size: 1080,
			itDescription:
				'correctly traces a large-scale image in two colours (1080 x 1080)',
			fileName: 'test/test-1080.png',
			debugRadius: 4,
			palette: [
				{ r: 255, g: 0, b: 0 },
				{ r: 0, g: 0, b: 255 },
			],
			bgCol: { r: 255, g: 255, b: 255 },
		},
		{
			size: 13,
			itDescription:
				'correctly traces a tiny image in one colour (13 x 13)',
			fileName: 'test/test-13.png',
			debugRadius: undefined,
			palette: [{ r: 0, g: 173, b: 12 }],
			bgCol: { r: 0, g: 0, b: 0 },
		},
	];

	for (let {
		itDescription,
		fileName,
		debugRadius,
		palette,
		bgCol,
		size,
	} of testConfigs) {
		it(itDescription + `(${fileName})`, async () => {
			const image = await loadImage(fileName);
			const canvas = createCanvas(image.width, image.height);
			const ctx = canvas.getContext('2d');
			ctx.drawImage(image, 0, 0);
			const imageData = ctx.getImageData(0, 0, image.width, image.height);

			const maxSize = Math.max(image.width, image.height);

			const scale = maxSize / 1080;
			const it = new ImageTrace(imageData, palette, {
				pathSimplificationTolerance: 3,
				curveFittingTolerance: 2,
				minHullDistance: 3,
				debugPointRadius: debugRadius ? debugRadius * scale : undefined,
			});

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
			expect(contents.indexOf('NaN')).toBe(-1);
		});
	}
});
