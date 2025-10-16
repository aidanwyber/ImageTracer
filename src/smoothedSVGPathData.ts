import type { Vec2, SmoothingOptions } from './types';
import { nf } from './util';

/**
 * Converts an array of 2D points into a smooth SVG path using Catmull-Rom splines
 * and Chaikin's corner cutting algorithm.
 *
 * @param points - Array of Vec2 points to be converted
 * @param smoothingMinLength - Minimum length threshold for smoothing
 * @param chaikinSmoothingSteps - Number of Chaikin smoothing iterations
 * @param width - Canvas width
 * @param height - Canvas height
 * @returns SVG path data string
 */
export function smoothedSVGPathData(
	points: Vec2[],
	smoothingMinLength: number,
	chaikinSmoothingSteps: number,
	width: number,
	height: number
): string {
	// const pts = points.map(([x, y]): Vec2 => ({ x, y }));
	const smoothedPoints = applyChaikinSmoothing(
		points,
		chaikinSmoothingSteps,
		true
	);
	return catmullRomToBezierPath(smoothedPoints);
}

/**
 * Converts Catmull-Rom control points into a smooth cubic Bezier SVG path.
 *
 * @param points - Array of control points
 * @param options - Optional configuration for path generation
 * @returns SVG path data string
 */
export function catmullRomToBezierPath(
	points: Vec2[],
	options: SmoothingOptions = {}
): string {
	const { isClosed = true, alpha = 0.5 } = options;

	if (points.length < 2) return '';

	const P = preparePointArray(points, isClosed);
	let pathData = `M ${nf(points[0].x)} ${nf(points[0].y)}`;

	for (let i = 1; i < P.length - 2; i++) {
		const [c1x, c1y, c2x, c2y] = calculateBezierControlPoints(
			P[i - 1],
			P[i],
			P[i + 1],
			P[i + 2],
			alpha
		);
		pathData += ` C ${nf(c1x)} ${nf(c1y)}, ${nf(c2x)} ${nf(c2y)}, ${nf(
			P[i + 1].x
		)} ${nf(P[i + 1].y)}`;
	}

	return isClosed ? `${pathData} Z` : pathData;
}

/**
 * Applies multiple iterations of Chaikin's corner-cutting algorithm
 *
 * @param points - Array of points to smooth
 * @param iterations - Number of smoothing iterations
 * @param isClosed - Whether the path is closed
 * @returns Smoothed array of points
 */
function applyChaikinSmoothing(
	points: Vec2[],
	iterations: number,
	isClosed: boolean
): Vec2[] {
	let result = points;
	for (let i = 0; i < iterations; i++) {
		result = chaikinOnce(result, isClosed);
	}
	return result;
}

/**
 * Performs one iteration of Chaikin's corner-cutting algorithm
 *
 * @param pts - Input points
 * @param isClosed - Whether the path is closed
 * @returns New array of smoothed points
 */
function chaikinOnce(pts: Vec2[], isClosed: boolean): Vec2[] {
	const out: Vec2[] = [];
	const n = pts.length;

	if (!isClosed) out.push(pts[0]);

	const end = isClosed ? n : n - 1;
	for (let i = 0; i < end - 1; i++) {
		const [Q, R] = calculateChaikinPoints(pts[i], pts[i + 1]);
		out.push(Q, R);
	}

	if (!isClosed) {
		out.push(pts[n - 1]);
	} else {
		const [Q, R] = calculateChaikinPoints(pts[n - 1], pts[0]);
		out.push(Q, R);
	}

	return out;
}

/**
 * Helper function to calculate Bezier control points
 */
function calculateBezierControlPoints(
	p0: Vec2,
	p1: Vec2,
	p2: Vec2,
	p3: Vec2,
	alpha: number
): [number, number, number, number] {
	const t1x = alpha * (p2.x - p0.x);
	const t1y = alpha * (p2.y - p0.y);
	const t2x = alpha * (p3.x - p1.x);
	const t2y = alpha * (p3.y - p1.y);

	return [p1.x + t1x / 3, p1.y + t1y / 3, p2.x - t2x / 3, p2.y - t2y / 3];
}

/**
 * Helper function to calculate Chaikin points
 */
function calculateChaikinPoints(p: Vec2, q: Vec2): [Vec2, Vec2] {
	return [
		{
			x: 0.75 * p.x + 0.25 * q.x,
			y: 0.75 * p.y + 0.25 * q.y,
		},
		{
			x: 0.25 * p.x + 0.75 * q.x,
			y: 0.25 * p.y + 0.75 * q.y,
		},
	];
}

/**
 * Helper function to prepare point array for path generation
 */
function preparePointArray(points: Vec2[], isClosed: boolean): Vec2[] {
	const P = points.slice();
	if (isClosed) {
		P.unshift(points[points.length - 1]);
		P.push(points[0], points[1]);
	} else {
		P.unshift(points[0]);
		P.push(points[points.length - 1]);
	}
	return P;
}
