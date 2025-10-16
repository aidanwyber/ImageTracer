// import { createHullPoints } from './createHull';
import type { Color, Vec2, ImageDataLike, ImageTraceOptions } from './types';
import { Hull } from './Hull';
import { smoothedSVGPathData } from './smoothedSVGPathData';
import { nf } from './util';

/**
 * ImageTrace converts raster images to vector graphics by detecting and tracing
 * color-matched regions into SVG paths.
 */
export class ImageTrace {
	readonly width: number;
	readonly height: number;
	readonly smoothingMinLength: number;
	readonly chaikinSmoothingSteps: number;
	readonly pixelGridStepSize: number;
	readonly hulls: Hull[];
	readonly debugPointRadius: number | undefined;

	/**
	 * Creates a new ImageTrace instance
	 *
	 * @param imageData - The source image data to trace
	 * @param palette - Array of colors to match against
	 * @param options - Configuration options for tracing
	 * @throws {Error} If imageData or palette is invalid
	 */
	constructor(
		imageData: ImageDataLike,
		palette: Color[],
		options: ImageTraceOptions
	) {
		if (!imageData) throw new Error('imageData is required');
		if (!palette?.length)
			throw new Error('palette must contain at least one color');

		const {
			smoothingMinLength,
			chaikinSmoothingSteps,
			pixelGridStepSize = 1,
			debugPointRadius,
		} = options;

		this.width = imageData.width;
		this.height = imageData.height;
		this.smoothingMinLength = smoothingMinLength;
		this.chaikinSmoothingSteps = chaikinSmoothingSteps;
		this.pixelGridStepSize = Math.max(1, Math.floor(pixelGridStepSize));
		this.debugPointRadius = debugPointRadius;
		this.hulls = this.createHullsFromPalette(imageData, palette);
	}

	/**
	 * Retrieves a hull by its color
	 */
	getHullByColor(color: Color): Hull | undefined {
		return this.hulls.find(hull => this.colorsMatch(hull.color, color));
	}

	/**
	 * Generates an SVG string representation of the traced image
	 */
	getSVGString(): string {
		const svg: string[] = [
			`<svg width="${this.width}" height="${this.height}" `,
			'version="1.1" xmlns="http://www.w3.org/2000/svg" ',
			'desc="Created with VectorCraft">\n',
		];

		for (const hull of this.hulls) {
			svg.push(this.createPathElement(hull.hullPoints, hull.color));

			if (this.debugPointRadius !== undefined) {
				svg.push(this.createPointElements(hull.hullPoints));
			}
		}

		svg.push('</svg>');
		return svg.join('');
	}

	private createHullsFromPalette(
		imageData: ImageDataLike,
		palette: Color[]
	): Hull[] {
		return palette.map(color => this.createHullForColor(imageData, color));
	}

	private createHullForColor(imageData: ImageDataLike, color: Color): Hull {
		const maskPoints = this.createMaskPointCloud(imageData, color);
		return new Hull(color, maskPoints, this.smoothingMinLength);
	}

	private createMaskPointCloud(
		imageData: ImageDataLike,
		color: Color
	): Vec2[] {
		const { data, width, height } = imageData;
		const points: Vec2[] = [];
		const stride = this.pixelGridStepSize;

		for (let y = 0; y < height; y += stride) {
			for (let x = 0; x < width; x += stride) {
				const index = (y * width + x) * 4;
				if (this.pixelMatches(data, index, color)) {
					points.push({ x, y });
				}
			}
		}
		return points;
	}

	private createPathElement(points: Vec2[], color: Color): string {
		const { r, g, b } = color;
		const pathData = smoothedSVGPathData(
			points,
			this.smoothingMinLength,
			this.chaikinSmoothingSteps,
			this.width,
			this.height
		);
		return `<path fill="rgb(${r},${g},${b})" d="${pathData}" />\n`;
	}

	private createPointElements(points: Vec2[]): string {
		return points
			.map(
				point =>
					`<circle cx="${nf(point.x)}" cy="${nf(point.y)}" ` +
					`r="${this.debugPointRadius}" fill="#000" stroke="none" />\n`
			)
			.join('');
	}

	private pixelMatches(
		data: ArrayLike<number>,
		index: number,
		color: Color
	): boolean {
		return (
			data[index + 3] !== 0 && // alpha
			data[index] === color.r &&
			data[index + 1] === color.g &&
			data[index + 2] === color.b
		);
	}

	private colorsMatch(c1: Color, c2: Color): boolean {
		return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b;
	}
}
