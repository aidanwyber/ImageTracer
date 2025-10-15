import type { Color, Vec2 } from './types';
// import { createHullPoints } from './createHull';

import concaveman from 'concaveman';

export class Hull {
	static concavity = 1;
	static lengthThreshold = 10;

	readonly color: Color;
	readonly sampledPoints: Vec2[];
	readonly hullPoints: Vec2[];

	constructor(color: Color, sampledPoints: Vec2[]) {
		this.color = color;
		this.sampledPoints = sampledPoints;
		this.hullPoints = sampledPoints.length
			? (concaveman(sampledPoints, Hull.concavity, 1) as Vec2[])
			: [];
		// more info:
		// https://github.com/mapbox/concaveman
	}
}
