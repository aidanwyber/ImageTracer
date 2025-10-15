import { quickHull } from '@derschmale/tympanum';
import { Vector } from '@derschmale/tympanum/build/types/types';

export function createHulls(points: Vector[]): Vector[][] {
	const hulls = quickHull(points);
	return hulls.map(facet => facet.verts.map(index => points[index]));
}
