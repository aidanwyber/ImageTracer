import { createHull } from './createHull';
import type { Color, Vec2 } from './types';

export interface ImageDataLike {
	data: ArrayLike<number>;
	width: number;
	height: number;
}

export class Hull {
	readonly color: Color;
	readonly width: number;
	readonly height: number;
	readonly mask: Uint8ClampedArray;
	readonly sampledPoints: Vec2[];
	readonly hullPoints: Vec2[];

	constructor(options: {
		color: Color;
		width: number;
		height: number;
		mask: Uint8ClampedArray;
		sampledPoints: Vec2[];
		hullPoints: Vec2[];
	}) {
		this.color = options.color;
		this.width = options.width;
		this.height = options.height;
		this.mask = options.mask;
		this.sampledPoints = options.sampledPoints;
		this.hullPoints = options.hullPoints;
	}

	toImageData(): ImageDataLike {
		return {
			data: new Uint8ClampedArray(this.mask),
			width: this.width,
			height: this.height,
		};
	}
}

export class ImageTracer {
	readonly width: number;
	readonly height: number;
	readonly pixelGridSize: number;
	readonly hulls: Hull[];

	constructor(imageData: ImageDataLike, palette: Color[], pixelGridSize = 1) {
		if (!imageData) {
			throw new Error('imageData is required');
		}

		if (!palette?.length) {
			throw new Error('palette must contain at least one colour');
		}

		this.width = imageData.width;
		this.height = imageData.height;
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

	private createHullForColor(imageData: ImageDataLike, color: Color): Hull {
		const { mask, points } = this.createMask(imageData, color);
		const hullPoints = points.length ? createHull(points) : [];

		return new Hull({
			color,
			width: this.width,
			height: this.height,
			mask,
			sampledPoints: points,
			hullPoints,
		});
	}

	private createMask(
		imageData: ImageDataLike,
		color: Color
	): { mask: Uint8ClampedArray; points: Vec2[] } {
		const { data } = imageData;
		const mask = new Uint8ClampedArray(
			imageData.width * imageData.height * 4
		);
		const points: Vec2[] = [];
		const stride = this.pixelGridSize;
		const width = imageData.width;
		const height = imageData.height;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const index = (y * width + x) * 4;
				const r = data[index];
				const g = data[index + 1];
				const b = data[index + 2];
				const a = data[index + 3];

				const matches =
					a !== 0 && r === color.r && g === color.g && b === color.b;
				const value = matches ? 0 : 255;

				mask[index] = value;
				mask[index + 1] = value;
				mask[index + 2] = value;
				mask[index + 3] = 255;

				if (matches && x % stride === 0 && y % stride === 0) {
					points.push([x, y]);
				}
			}
		}

		return { mask, points };
	}
}
