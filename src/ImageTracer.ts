import p5 from 'p5';
import { Polygonizer } from './Polygonizer';
import { createHulls } from './createHulls';
import type { Color, Point } from './types';
import { Svg, SVG } from '@svgdotjs/svg.js';

export class ImageTracer {
	width: number;
	height: number;

	hulls: Hull[];
	isDone = false;

	constructor(
		pixelArray: number[],
		width: number,
		height: number,
		pixelGridSize: number = 1,
		palette: Color[]
	) {
		this.width = width;
		this.height = height;

		this.hulls = [];

		const sketch = new p5((sketch: p5) => {
			sketch.setup = () => {
				sketch.createCanvas(width, height);
			};
		});
	}

	downloadAsSvg(fileName: string) {
		var draw = SVG('traceResult').size(this.width, this.height) as Svg;
		draw.viewbox(0, 0, this.width, this.height);
	}

	private download(fileName: string, extension: string, text: string) {
		const element = document.createElement('a');
		element.setAttribute(
			'href',
			'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
		);
		element.setAttribute('download', fileName + '.' + extension);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}
}

export class Hull {
	points: Point[];

	constructor(points: Point[]);
}
