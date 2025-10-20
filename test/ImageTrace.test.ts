import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Color, ImageDataLike, Vec2 } from '../src/types';

const { concavemanMock, simplifyMock, createTangentMock, fitCubicMock } =
	vi.hoisted(() => ({
		concavemanMock: vi.fn<(points: number[][]) => number[][]>(
			points => points
		),
		simplifyMock: vi.fn<
			(points: Vec2[], tolerance: number, highQuality: boolean) => Vec2[]
		>(points => points),
		createTangentMock: vi.fn(() => [1, 0] as const),
		fitCubicMock: vi.fn(() => [
			[
				[0, 0],
				[1, 1],
				[2, 2],
				[3, 3],
			],
		]),
	}));

vi.mock('concaveman', () => ({
	default: concavemanMock,
}));

vi.mock('simplify-js', () => ({
	default: simplifyMock,
}));

vi.mock('fit-curve', () => ({
	createTangent: createTangentMock,
	fitCubic: fitCubicMock,
}));

import { ImageTrace } from '../src/ImageTrace';

const RED: Color = { r: 255, g: 0, b: 0 };
const BLUE: Color = { r: 0, g: 0, b: 255 };

function createImageData(
	width: number,
	height: number,
	pixels: Color[]
): ImageDataLike {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let i = 0; i < pixels.length; i++) {
		const { r, g, b } = pixels[i];
		const offset = i * 4;
		data[offset] = r;
		data[offset + 1] = g;
		data[offset + 2] = b;
		data[offset + 3] = 255;
	}
	return { data, width, height };
}

describe('ImageTrace', () => {
	beforeEach(() => {
		concavemanMock.mockClear();
		simplifyMock.mockClear();
		createTangentMock.mockClear();
		fitCubicMock.mockClear();

		concavemanMock.mockImplementation(points => points);
		simplifyMock.mockImplementation(points => points);
		createTangentMock.mockReturnValue([1, 0]);
		fitCubicMock.mockReturnValue([
			[
				[0, 0],
				[1, 1],
				[2, 2],
				[3, 3],
			],
		]);
	});

	it('requires valid image data and palette', () => {
		expect(
			() =>
				new ImageTrace(undefined as unknown as ImageDataLike, [RED], {
					pathSimplification: 1,
					curveFittingTolerance: 1,
				})
		).toThrow('imageData is required');

		const imageData = createImageData(1, 1, [RED]);
		expect(
			() =>
				new ImageTrace(imageData, [], {
					pathSimplification: 1,
					curveFittingTolerance: 1,
				})
		).toThrow('palette must contain at least one color');
	});

	it('builds hulls for each palette color and retrieves them by color match', () => {
		const imageData = createImageData(3, 2, [
			RED,
			RED,
			BLUE,
			BLUE,
			RED,
			BLUE,
		]);

		const tracer = new ImageTrace(imageData, [RED, BLUE], {
			pathSimplification: 0.5,
			curveFittingTolerance: 1,
			pixelGridStepSize: 1.9,
			debugPointRadius: 2,
		});

		expect(tracer.width).toBe(3);
		expect(tracer.height).toBe(2);
		expect(tracer.pixelGridStepSize).toBe(1);
		expect(tracer.validHulls).toHaveLength(2);

		const redHull = tracer.getHullByColor({ ...RED });
		const blueHull = tracer.getHullByColor({ ...BLUE });

		expect(redHull).toBeDefined();
		expect(blueHull).toBeDefined();
		expect(tracer.getSVGString()).toContain('<circle');
	});

	it('uses the pixel grid step size when sampling mask points', () => {
		const imageData = createImageData(4, 4, Array(16).fill(RED));

		const tracer = new ImageTrace(imageData, [RED], {
			pathSimplification: 0.5,
			curveFittingTolerance: 1,
			pixelGridStepSize: 2.7,
		});

		expect(tracer.pixelGridStepSize).toBe(2);
		expect(concavemanMock).toHaveBeenCalledTimes(1);
		const sampledPoints = concavemanMock.mock.calls[0][0];
		expect(sampledPoints).toEqual([
			[0, 0],
			[2, 0],
			[0, 2],
			[2, 2],
		]);
		expect(tracer.validHulls[0].hullPoints).toHaveLength(4);
	});

	it('filters out invalid hulls returned by the palette scan', () => {
		concavemanMock
			.mockImplementationOnce(() => [
				[0, 0],
				[1, 1],
			])
			.mockImplementationOnce(points => points);

		const imageData = createImageData(3, 2, [
			RED,
			RED,
			BLUE,
			BLUE,
			BLUE,
			BLUE,
		]);

		const tracer = new ImageTrace(imageData, [RED, BLUE], {
			pathSimplification: 0.5,
			curveFittingTolerance: 1,
		});

		expect(tracer.validHulls).toHaveLength(1);
		expect(tracer.validHulls[0].color).toEqual(BLUE);
	});
});
