import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Vec2, Color } from '../src/types';

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

import { Hull } from '../src/Hull';

const COLOR: Color = { r: 255, g: 0, b: 0 };
const SAMPLE_POINTS: Vec2[] = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
        { x: 0, y: 2 },
];

const WIDTH = 4;
const HEIGHT = 4;

describe('Hull', () => {
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

	it('marks hulls with fewer than three points as invalid', () => {
		concavemanMock.mockReturnValueOnce([
			[0, 0],
			[1, 1],
		]);
                const hull = new Hull(COLOR, SAMPLE_POINTS.slice(0, 2), 1, 1, WIDTH, HEIGHT);

		expect(hull.isValid).toBe(false);
		expect(hull.getPathElem()).toBe('');
		expect(fitCubicMock).not.toHaveBeenCalled();
	});

	it('generates SVG path data for valid hulls', () => {
                const hull = new Hull(COLOR, SAMPLE_POINTS, 0.5, 2, WIDTH, HEIGHT);

                expect(hull.isValid).toBe(true);
                expect(hull.getPathData()).toBe('M 0 0 C 0 0, 3 3, 3 3 Z');
                expect(hull.getPathElem()).toBe(
                        '<path fill="rgb(255,0,0)" d="M 0 0 C 0 0, 3 3, 3 3 Z" />\n'
                );
                expect(createTangentMock).toHaveBeenCalledTimes(1);
                expect(fitCubicMock).toHaveBeenCalledTimes(1);
        });

        it('delegates point simplification to simplify-js', () => {
                const hull = new Hull(COLOR, SAMPLE_POINTS, 0.5, 1, WIDTH, HEIGHT);
		simplifyMock.mockClear();

		const arbitraryPoints: Vec2[] = [
			{ x: 0, y: 0 },
			{ x: 1, y: 1 },
			{ x: 2, y: 0 },
		];
		const simplifiedPoints: Vec2[] = [
			{ x: 0, y: 0 },
			{ x: 2, y: 0 },
		];
		simplifyMock.mockReturnValueOnce(simplifiedPoints);

		const result = hull.reducePoints(arbitraryPoints, 0.75);

                expect(simplifyMock).toHaveBeenCalledWith(arbitraryPoints, 0.75, true);
                expect(result).toBe(simplifiedPoints);
        });

        it('forces straight segments when points share an image boundary', () => {
                fitCubicMock.mockReturnValueOnce([
                        [
                                [0, 0],
                                [0.5, 0.2],
                                [2.5, 0.1],
                                [3, 0],
                        ],
                ]);

                const hull = new Hull(COLOR, SAMPLE_POINTS, 0.5, 1, WIDTH, HEIGHT);

                expect(hull.getPathData()).toBe('M 0 0 C 0 0, 3 0, 3 0 Z');
        });
});
