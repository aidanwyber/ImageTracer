import type { Color, Vec2 } from './types';
import { distSq } from './util';

import concaveman from 'concaveman';

export class Hull {
	static concavity = 1;
	static lengthThreshold = 10;

	readonly color: Color;
	readonly sampledPoints: Vec2[];
	readonly hullPoints: Vec2[];

	constructor(
		color: Color,
		sampledPoints: Vec2[],
		smoothingMinLength: number
	) {
		this.color = color;
		this.sampledPoints = sampledPoints;

		const arrayPoints = sampledPoints.map(pt => [pt.x, pt.y]);
		this.hullPoints = this.reducePoints(
			concaveman(arrayPoints, Hull.concavity, 1).map(([x, y]) => ({
				x,
				y,
			})),
			smoothingMinLength
		);
		// more info:
		// https://github.com/mapbox/concaveman
	}

	/**
	 * Reduces the number of points in a path while maintaining its shape
	 */
	reducePoints(points: Vec2[], minDist: number): Vec2[] {
		const minDistSq = minDist * minDist;
		const filteredPoints: Vec2[] = [];

		for (const pt of points) {
			if (
				filteredPoints.length === 0 ||
				distSq(pt, filteredPoints[filteredPoints.length - 1]) >=
					minDistSq
			) {
				filteredPoints.push(pt);
			}
		}

		if (
			filteredPoints.length > 1 &&
			distSq(
				filteredPoints[0],
				filteredPoints[filteredPoints.length - 1]
			) < minDistSq
		) {
			filteredPoints.pop();
		}

		return filteredPoints;
	}
}
