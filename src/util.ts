import type { Vec2 } from './types';

/**
 * Calculates the squared distance between two points
 */
export function distSq(a: Vec2, b: Vec2): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}

export function nf(x: number, precision = 3): string {
	const k10 = 10 ** precision;
	return (Math.round(x * k10) / k10).toString();
}
