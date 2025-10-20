import type { Color, Vec2 } from './types';

import concaveman from 'concaveman';
import simplify from 'simplify-js';
import * as FitCurve from 'fit-curve';
import { nf } from './util';

export class Hull {
        static concavity = 1;

        readonly color: Color;
        readonly hullPoints: Vec2[];
        readonly cubics?: Vec2[][];

        private readonly imageWidth: number;
        private readonly imageHeight: number;

        readonly isValid: boolean;

        constructor(
                color: Color,
                sampledPoints: Vec2[],
                pathSimplification: number,
                curveFittingTolerance: number,
                width: number,
                height: number
        ) {
                this.color = color;
                this.imageWidth = width;
                this.imageHeight = height;

                const arrayPoints = sampledPoints.map(pt => [pt.x, pt.y]);
                this.hullPoints = this.reducePoints(
                        concaveman(arrayPoints, Hull.concavity, 1).map(([x, y]) => ({
                                x,
				y,
			})),
			pathSimplification
		);
		// more info:
		// https://github.com/mapbox/concaveman

		this.isValid = this.hullPoints.length >= 3;

		if (this.isValid) {
			const vec2Arr = ({ x, y }: Vec2) => [x, y];
			const arr2Vec = ([x, y]: number[]) => ({ x, y });

			const loopTangent = FitCurve.createTangent(
				vec2Arr(this.hullPoints[1]),
				vec2Arr(this.hullPoints[this.hullPoints.length - 2])
			);
                        const fittedCurves = FitCurve.fitCubic(
                                this.hullPoints.map(v => vec2Arr(v)),
                                loopTangent,
                                loopTangent.map(x => -x),
                                curveFittingTolerance
                        ).map(([a, ca, cb, b]) => [
                                arr2Vec(a),
                                arr2Vec(ca),
                                arr2Vec(cb),
                                arr2Vec(b),
                        ]);

                        this.cubics = this.applyBoundaryConstraints(fittedCurves);
                }
        }

	/**
	 * Reduces the number of points in a path while maintaining its shape
	 */
	reducePoints(points: Vec2[], tolerance: number): Vec2[] {
		return simplify(points, tolerance, true);
	}

	getPathData(): string {
		if (!this.cubics) return '';

		let data: string[] = [];

		const firstCurve = this.cubics[0];
		data.push(`M ${nf(firstCurve[0].x)} ${nf(firstCurve[0].y)}`);

		for (let curve of this.cubics) {
			data.push(
				`C ${nf(curve[1].x)} ${nf(curve[1].y)}, ` +
					`${nf(curve[2].x)} ${nf(curve[2].y)}, ` +
					`${nf(curve[3].x)} ${nf(curve[3].y)}`
			);
		}

		data.push(`Z`);
		return data.join(' ');
	}

        getPathElem(): string {
                if (!this.isValid) return '';
                return (
                        `<path fill="rgb(${this.color.r},${this.color.g},${this.color.b})" ` +
                        `d="${this.getPathData()}" />\n`
                );
        }

        private applyBoundaryConstraints(curves: Vec2[][]): Vec2[][] {
                const adjusted = curves.map(curve => curve.map(point => ({ ...point })) as Vec2[]);
                const boundaryEps = 0.5;
                const maxX = this.imageWidth - 1;
                const maxY = this.imageHeight - 1;

                const getSides = (pt: Vec2): BoundarySide[] => {
                        const sides: BoundarySide[] = [];
                        if (Math.abs(pt.x - 0) <= boundaryEps) sides.push('LEFT');
                        if (Math.abs(pt.x - maxX) <= boundaryEps) sides.push('RIGHT');
                        if (Math.abs(pt.y - 0) <= boundaryEps) sides.push('TOP');
                        if (Math.abs(pt.y - maxY) <= boundaryEps) sides.push('BOTTOM');
                        return sides;
                };

                for (const curve of adjusted) {
                        const start = curve[0];
                        const end = curve[3];
                        const startSides = getSides(start);
                        const endSides = getSides(end);
                        const startOnBoundary = startSides.length > 0;
                        const endOnBoundary = endSides.length > 0;
                        const shareSide = startSides.some(side => endSides.includes(side));

                        if (startOnBoundary && endOnBoundary && shareSide) {
                                curve[1] = { ...start };
                                curve[2] = { ...end };
                                continue;
                        }

                        if (startOnBoundary) {
                                curve[1] = { ...start };
                        }

                        if (endOnBoundary) {
                                curve[2] = { ...end };
                        }
                }

                return adjusted;
        }
}

type BoundarySide = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';
