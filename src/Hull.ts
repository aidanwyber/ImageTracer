import type { Color, Vec2 } from './types';
import { createHullPoints } from './createHull';

export class Hull {
	readonly color: Color;
	readonly sampledPoints: Vec2[];
	readonly hullPoints: Vec2[];

	constructor(color: Color, sampledPoints: Vec2[]) {
		this.color = color;
		this.sampledPoints = sampledPoints;
		this.hullPoints = sampledPoints.length
			? createHullPoints(sampledPoints)
			: [];
	}
}
