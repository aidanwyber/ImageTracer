import type { Color, Vec2 } from './types';

export function smoothedSVGPathData(
	points: Vec2[],
	smoothingMinLength: number,
	width: number,
	height: number
): string {
	// hull: Array<[x,y]> from concaveman
	points = reducePoints(points, smoothingMinLength);
	const pts = points.map(([x, y]) => ({ x, y }));
	const d = pointsToQuadraticSVGPath(pts, width, height, {
		closed: true,
		eps: 1e-3,
		chaikinRounds: 1, // try 0, 1, or 2 depending on noisiness
	});
	return d;
}

function reducePoints(points: Vec2[], minDist: number) {
	const minDistSq = minDist * minDist;
	const filteredPoints: Vec2[] = [];
	for (const pt of points) {
		if (filteredPoints.length === 0) {
			filteredPoints.push(pt);
			continue;
		}

		const dx = pt[0] - filteredPoints[filteredPoints.length - 1][0];
		const dy = pt[1] - filteredPoints[filteredPoints.length - 1][1];
		const distSq = dx * dx + dy + dy;

		if (distSq >= minDistSq) {
			filteredPoints.push(pt);
		}
	}
	return filteredPoints;
}

type Pt = { x: number; y: number };

function pointsToQuadraticSVGPath(
	pts: Pt[],
	width: number,
	height: number,
	opts: {
		closed?: boolean;
		eps?: number; // tolerance for “touches border”
		chaikinRounds?: number; // optional pre-smoothing
	} = {}
): string {
	const closed = opts.closed ?? true;
	const eps = opts.eps ?? 1e-6;
	const chaikinRounds = opts.chaikinRounds ?? 0;

	if (pts.length < 2) return '';

	// Optional: light pre-smoothing of the hull
	let P = pts.slice();
	for (let r = 0; r < chaikinRounds; r++) P = chaikinOnce(P, closed);

	const n = P.length;
	const isBorder = (p: Pt) =>
		Math.abs(p.x - 0) < eps ||
		Math.abs(p.y - 0) < eps ||
		Math.abs(p.x - width) < eps ||
		Math.abs(p.y - height) < eps;

	// Midpoints between consecutive vertices (wrap if closed)
	const M: Pt[] = [];
	const last = (i: number) => (i + n) % n;
	for (let i = 0; i < n; i++) {
		// const j = closed ? (i + 1) % n : i + 1;
		const j = (i + 1) % n; // wraps around, assumes being closes
		if (j >= n) break;
		M.push({ x: (P[i].x + P[j].x) / 2, y: (P[i].y + P[j].y) / 2 });
	}

	// Start at first midpoint for closed shapes, else at first point
	let d = '';
	if (closed) {
		d += `M ${M[0].x} ${M[0].y}`;
		for (let i = 0; i < n; i++) {
			const ctrl = P[i];
			const end = M[i % M.length];

			if (isBorder(ctrl)) {
				// Force a sharp vertex at ctrl:
				// 1) end previous segment exactly at the vertex (break tangent)
				d += ` Q ${ctrl.x} ${ctrl.y}, ${ctrl.x} ${ctrl.y}`;
				// 2) leave the corner using the usual quadratic segment
				d += ` Q ${ctrl.x} ${ctrl.y}, ${end.x} ${end.y}`;
			} else {
				// Smooth quadratic segment
				d += ` Q ${ctrl.x} ${ctrl.y}, ${end.x} ${end.y}`;
			}
		}
		d += ' Z';
	} else {
		// Open polyline variant
		d += `M ${P[0].x} ${P[0].y}`;
		for (let i = 0; i < n - 1; i++) {
			const ctrl = P[i];
			const end = {
				x: (P[i].x + P[i + 1].x) / 2,
				y: (P[i].y + P[i + 1].y) / 2,
			};
			if (isBorder(ctrl)) {
				d += ` Q ${ctrl.x} ${ctrl.y}, ${ctrl.x} ${ctrl.y}`;
				d += ` Q ${ctrl.x} ${ctrl.y}, ${end.x} ${end.y}`;
			} else {
				d += ` Q ${ctrl.x} ${ctrl.y}, ${end.x} ${end.y}`;
			}
		}
		// Finish at last point
		d += ` L ${P[n - 1].x} ${P[n - 1].y}`;
	}

	return d;
}

// One round of Chaikin’s corner-cutting (keeps endpoints if open)
function chaikinOnce(pts: Pt[], closed: boolean): Pt[] {
	const out: Pt[] = [];
	const n = pts.length;
	if (!closed) out.push(pts[0]);

	const end = closed ? n : n - 1;
	for (let i = 0; i < end - 1; i++) {
		const p = pts[i],
			q = pts[i + 1];
		const Q = {
			x: 0.75 * p.x + 0.25 * q.x,
			y: 0.75 * p.y + 0.25 * q.y,
		};
		const R = {
			x: 0.25 * p.x + 0.75 * q.x,
			y: 0.25 * p.y + 0.75 * q.y,
		};
		out.push(Q, R);
	}

	if (!closed) out.push(pts[n - 1]);
	else {
		// wrap last->first
		const p = pts[n - 1],
			q = pts[0];
		const Q = {
			x: 0.75 * p.x + 0.25 * q.x,
			y: 0.75 * p.y + 0.25 * q.y,
		};
		const R = {
			x: 0.25 * p.x + 0.75 * q.x,
			y: 0.25 * p.y + 0.75 * q.y,
		};
		out.push(Q, R);
	}

	return out;
}
