import type { Point } from './types';

function cross(o: Point, a: Point, b: Point): number {
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function pointsEqual(a: Point, b: Point): boolean {
        return a[0] === b[0] && a[1] === b[1];
}

export function createHull(points: Point[]): Point[] {
        if (points.length <= 1) {
                return points.slice();
        }

        const sorted = points
                .map(point => [point[0], point[1]] as Point)
                .sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));

        const unique: Point[] = [];
        for (const point of sorted) {
                if (!unique.length || !pointsEqual(unique[unique.length - 1], point)) {
                        unique.push(point);
                }
        }

        if (unique.length <= 1) {
                return unique.slice();
        }

        const lower: Point[] = [];
        for (const point of unique) {
                while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
                        lower.pop();
                }
                lower.push(point);
        }

        const upper: Point[] = [];
        for (let i = unique.length - 1; i >= 0; i--) {
                const point = unique[i];
                while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
                        upper.pop();
                }
                upper.push(point);
        }

        lower.pop();
        upper.pop();

        return lower.concat(upper);
}
