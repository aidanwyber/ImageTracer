// import { createHullPoints } from './createHull';
import type { Color, Vec2 } from './types';
import { Hull } from './Hull';
import { smoothedSVGPathData } from './smoothedSVGPathData';

export interface ImageDataLike {
	data: ArrayLike<number>;
	width: number;
	height: number;
}

export class ImageTracer {
	readonly width: number;
	readonly height: number;
	readonly pixelGridSize: number;
	readonly hulls: Hull[];
	smoothingMinLength: number;

	constructor(
		imageData: ImageDataLike,
		palette: Color[],
		smoothingMinLength: number,
		pixelGridSize = 1
	) {
		if (!imageData) {
			throw new Error('imageData is required');
		}

		if (!palette?.length) {
			throw new Error('palette must contain at least one colour');
		}

		this.width = imageData.width;
		this.height = imageData.height;
		this.smoothingMinLength = smoothingMinLength;
		this.pixelGridSize = Math.max(1, Math.floor(pixelGridSize));

		this.hulls = palette.map(color =>
			this.createHullForColor(imageData, color)
		);
	}

	getHullByColor(color: Color): Hull | undefined {
		return this.hulls.find(
			hull =>
				hull.color.r === color.r &&
				hull.color.g === color.g &&
				hull.color.b === color.b
		);
	}

	createHullForColor(imageData: ImageDataLike, color: Color): Hull {
		const maskPoints = this.createMaskPointCloud(imageData, color);
		return new Hull(color, maskPoints);
	}

	createMaskPointCloud(imageData: ImageDataLike, color: Color): Vec2[] {
		const { data } = imageData;
		const stride = this.pixelGridSize;
		const width = imageData.width;
		const height = imageData.height;
		const points: Vec2[] = [];

		for (let y = 0; y < height; y += stride) {
			for (let x = 0; x < width; x += stride) {
				const index = (y * width + x) * 4;
				const r = data[index];
				const g = data[index + 1];
				const b = data[index + 2];
				const a = data[index + 3];

				const matches =
					a !== 0 && r === color.r && g === color.g && b === color.b;

				if (matches) {
					points.push([x, y]);
				}
			}
		}
		return points;
	}

	getSVGString(precision = 3, doSmooth = true): string {
		let svg = `<svg width="${this.width}" height="${this.height}" version="1.1" xmlns="http://www.w3.org/2000/svg" desc="Created with image-tracer">\n`;

		const nf = (x: number) =>
			(Math.round(x * 10 ** precision) / 10 ** precision).toString();

		for (let hull of this.hulls) {
			const { r, g, b } = hull.color;
			const p0 = hull.hullPoints[0];
			let path = `<path fill="rgb(${r},${g},${b})" d="`;
			if (doSmooth) {
				path += smoothedSVGPathData(
					hull.hullPoints,
					this.smoothingMinLength,
					this.width,
					this.height
				);
			} else {
				path += `m ${nf(p0[0])} ${nf(p0[1])}`;
				for (let point of hull.hullPoints.slice(1)) {
					path += ` L ${point[0]} ${point[1]}`;
				}
				path += ' Z'; // close
			}
			path += '" />\n';
			svg += path;
		}

		svg += `</svg>`;

		return svg;
	}
}
