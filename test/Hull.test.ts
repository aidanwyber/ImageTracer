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
                                [2, 0],
                                [1, 1],
                                [2, 2],
                                [0, 2],
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
                expect(hull.getPathData()).toBe('M 0 0 L 2 0 C 1 1, 2 2, 0 2 L 0 0 Z');
                expect(hull.getPathElem()).toBe(
                        '<path fill="rgb(255,0,0)" d="M 0 0 L 2 0 C 1 1, 2 2, 0 2 L 0 0 Z" />\n'
                );
                expect(createTangentMock).toHaveBeenCalledTimes(2);
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
                expect(result).toEqual([
                        { x: 0, y: 0 },
                        { x: 1, y: 1 },
                        { x: 2, y: 0 },
                ]);
        });

        it('preserves boundary points removed during simplification', () => {
                const hull = new Hull(COLOR, SAMPLE_POINTS, 0.5, 1, WIDTH, HEIGHT);
                const boundaryRun: Vec2[] = [
                        { x: 0, y: 0 },
                        { x: 1, y: 0 },
                        { x: 2, y: 0 },
                ];

                simplifyMock.mockReturnValueOnce([{ x: 1, y: 0 }]);

                const result = hull.reducePoints(boundaryRun, 0.25);

                expect(result).toEqual(boundaryRun);
        });

        it('treats shared-boundary edges as straight path segments', () => {
                fitCubicMock.mockReturnValueOnce([
                        [
                                [2, 0],
                                [0.5, 0.2],
                                [2.5, 0.1],
                                [0, 2],
                        ],
                ]);

                const hull = new Hull(COLOR, SAMPLE_POINTS, 0.5, 1, WIDTH, HEIGHT);

                expect(hull.pathSegments).toBeDefined();
                expect(hull.pathSegments?.[0]).toEqual({
                        type: 'L',
                        points: [
                                { x: 0, y: 0 },
                                { x: 2, y: 0 },
                        ],
                });
                const lastSegment = hull.pathSegments?.[hull.pathSegments.length - 1];
                expect(lastSegment).toEqual({
                        type: 'L',
                        points: [
                                { x: 0, y: 2 },
                                { x: 0, y: 0 },
                        ],
                });
                expect(hull.getPathData()).toBe('M 0 0 L 2 0 C 0.5 0.2, 2.5 0.1, 0 2 L 0 0 Z');
        });

        it('keeps near-boundary curve segments cubic', () => {
                const nearBoundaryPoints: Vec2[] = [
                        { x: 0, y: 0 },
                        { x: 2, y: 0 },
                        { x: 2.2, y: 0.5 },
                        { x: 2.5, y: 1.5 },
                        { x: 0, y: 2 },
                ];

                concavemanMock.mockReturnValueOnce(
                        nearBoundaryPoints.map(({ x, y }) => [x, y])
                );
                simplifyMock.mockImplementationOnce(() => nearBoundaryPoints);
                fitCubicMock.mockReturnValueOnce([
                        [
                                [2, 0],
                                [2.1, 0.3],
                                [2.4, 1],
                                [2.5, 1.5],
                        ],
                        [
                                [2.5, 1.5],
                                [1.7, 1.8],
                                [0.8, 1.9],
                                [0, 2],
                        ],
                ]);

                const hull = new Hull(COLOR, nearBoundaryPoints, 0.5, 1, WIDTH, HEIGHT);

                expect(hull.pathSegments?.[0]).toEqual({
                        type: 'L',
                        points: [
                                { x: 0, y: 0 },
                                { x: 2, y: 0 },
                        ],
                });
                expect(hull.pathSegments?.[1]).toEqual({
                        type: 'C',
                        points: [
                                { x: 2, y: 0 },
                                { x: 2.1, y: 0.3 },
                                { x: 2.4, y: 1 },
                                { x: 2.5, y: 1.5 },
                        ],
                });
                expect(hull.pathSegments?.[2]).toEqual({
                        type: 'C',
                        points: [
                                { x: 2.5, y: 1.5 },
                                { x: 1.7, y: 1.8 },
                                { x: 0.8, y: 1.9 },
                                { x: 0, y: 2 },
                        ],
                });
        });

        it('restores neighbors next to boundary cusps for curve fitting', () => {
                const concavePoints: Vec2[] = [
                        { x: 0, y: 0 },
                        { x: 4, y: 0 },
                        { x: 3.5, y: 0.75 },
                        { x: 2, y: 2.5 },
                        { x: 0, y: 4 },
                ];

                concavemanMock.mockReturnValueOnce(concavePoints.map(({ x, y }) => [x, y]));
                simplifyMock.mockImplementationOnce(() => [
                        concavePoints[0],
                        concavePoints[1],
                        concavePoints[3],
                        concavePoints[4],
                ]);

                const hull = new Hull(COLOR, concavePoints, 0.5, 1, WIDTH, HEIGHT);

                expect(hull.hullPoints).toContainEqual(concavePoints[2]);
                expect(hull.pathSegments?.[0]).toEqual({
                        type: 'L',
                        points: [
                                { x: 0, y: 0 },
                                { x: 4, y: 0 },
                        ],
                });

                const curveCall = fitCubicMock.mock.calls[0]?.[0];
                expect(curveCall).toEqual([
                        [4, 0],
                        [3.5, 0.75],
                        [2, 2.5],
                        [0, 4],
                ]);

                expect(hull.pathSegments?.[1]?.type).toBe('C');
        });
});
