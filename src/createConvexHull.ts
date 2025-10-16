import type { Vec2 } from './types';

function cross2(o: Vec2, a: Vec2, b: Vec2): number {
	return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function pointsEqual(a: Vec2, b: Vec2): boolean {
	return a.x === b.x && a.y === b.y;
}

export function createConvexHullPoints(pointCloud: Vec2[]): Vec2[] {
	if (pointCloud.length <= 1) {
		return pointCloud.slice();
	}

	const sorted = pointCloud.sort((a, b) =>
		a.x === b.x ? a.y - b.y : a.x - b.x
	);

	const unique: Vec2[] = [];
	for (const point of sorted) {
		if (!unique.length || !pointsEqual(unique[unique.length - 1], point)) {
			unique.push(point);
		}
	}

	if (unique.length <= 1) {
		return unique.slice();
	}

	const lower: Vec2[] = [];
	for (const point of unique) {
		while (
			lower.length >= 2 &&
			cross2(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
		) {
			lower.pop();
		}
		lower.push(point);
	}

	const upper: Vec2[] = [];
	for (let i = unique.length - 1; i >= 0; i--) {
		const point = unique[i];
		while (
			upper.length >= 2 &&
			cross2(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
		) {
			upper.pop();
		}
		upper.push(point);
	}

	lower.pop();
	upper.pop();

	return lower.concat(upper);
}
