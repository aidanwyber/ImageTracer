import type { Color, Vec2 } from './types';

import concaveman from 'concaveman';
import simplify from 'simplify-js';
import * as FitCurve from 'fit-curve';
import { nf } from './util';
import { PathSegmentType, PathSegment, BoundarySide } from './types';

const vec2Arr = ({ x, y }: Vec2) => [x, y];
const arr2Vec = ([x, y]: number[]) => ({ x, y });
export class Hull {
	static concavity = 1;

	readonly hullPoints: Vec2[];
	readonly pathSegments?: PathSegment[];

	readonly isValid: boolean;

	constructor(
		public color: Color,
		public readonly sampledPoints: Vec2[],
		public readonly pathSimplification: number,
		public readonly curveFittingTolerance: number,
		public readonly width: number,
		public readonly height: number
	) {
		this.color = color;
		this.width = width;
		this.height = height;
		this.curveFittingTolerance = curveFittingTolerance;

		// const rc = () => Math.round(random() * 255);
		// this.color = { r: rc(), g: rc(), b: 128 };

		const arrayPoints = sampledPoints.map(pt => [pt.x, pt.y]);
		const concaveHull = concaveman(arrayPoints, Hull.concavity, 1).map(
			([x, y]) => ({
				x,
				y,
			})
		);

		this.hullPoints = this.reducePoints(concaveHull, pathSimplification);
		// more info:
		// https://github.com/mapbox/concaveman

		this.isValid = this.hullPoints.length >= 3;

		if (this.isValid) {
			this.pathSegments = this.createPathSegments(this.hullPoints);
		}
	}

	/**
	 * Reduces the number of points in a path while maintaining its shape
	 */
	reducePoints(points: Vec2[], tolerance: number): Vec2[] {
		return simplify(points, tolerance, true);
	}

	createPathSegments(simplifiedHullPoints: Vec2[]): PathSegment[] {
		const segments: PathSegment[] = [];

		const n = simplifiedHullPoints.length;

		const edgeTypes: PathSegmentType[] = new Array(n);
		let isClosedFreeShape = true;
		let nextStartIndex = -1; // finds border point if available for next iteration
		for (let i = 0; i < n; i++) {
			let start = simplifiedHullPoints[i];
			let end = simplifiedHullPoints[(i + 1) % n];
			const startSides = this.getBoundarySides(start);
			const endSides = this.getBoundarySides(end);
			const doShareSide = startSides.some(side =>
				endSides.includes(side)
			);

			if (startSides.length > 0)
				simplifiedHullPoints[i] = start = this.putOnSide(
					start,
					startSides
				);
			if (endSides.length > 0)
				simplifiedHullPoints[(i + 1) % n] = end = this.putOnSide(
					end,
					endSides
				);

			// edge i is the edge from pt i to pt i+1
			const isEdgeOnBorder =
				startSides.length > 0 && endSides.length > 0 && doShareSide;
			edgeTypes[i] = isEdgeOnBorder
				? PathSegmentType.Line
				: PathSegmentType.Curve;

			if (isEdgeOnBorder) {
				// if there is at least one line, the shape can't be a 'free' shape
				isClosedFreeShape = false;

				if (nextStartIndex === -1) nextStartIndex = i; // start of border edge (=== `start`)
			}
		}
		if (nextStartIndex === -1) nextStartIndex = 0;

		// cut points into segment point groups by type, in original order
		// this will become the structure of `segments`
		const pathSegEdgeArrangement: {
			type: PathSegmentType;
			edgeInds: number[];
		}[] = [{ type: edgeTypes[nextStartIndex], edgeInds: [] }];
		for (let i = nextStartIndex; i < nextStartIndex + n; i++) {
			let currInd = i % n;
			let nextInd = (i + 1) % n;

			if (
				this.isSamePoint(
					simplifiedHullPoints[currInd],
					simplifiedHullPoints[nextInd]
				)
			) {
				continue;
			}

			const lastSeg =
				pathSegEdgeArrangement[pathSegEdgeArrangement.length - 1];
			lastSeg.edgeInds.push(currInd);

			// change segment type if the next edge type is different
			if (currInd !== n - 1 && edgeTypes[currInd] !== edgeTypes[nextInd])
				pathSegEdgeArrangement.push({
					type: edgeTypes[nextInd],
					edgeInds: [],
				});
		}

		// convert edge arrangement into lines and curves
		for (let { type, edgeInds } of pathSegEdgeArrangement) {
			if (type === PathSegmentType.Line) {
				for (let ptInd of edgeInds) {
					segments.push({
						type,
						points: [
							simplifiedHullPoints[ptInd],
							simplifiedHullPoints[(ptInd + 1) % n],
						],
					});
				}
				continue;
			}

			// type === 'curve':

			if (edgeInds.length === 1) {
				// this curve has to be a small corner or a spanning rectangle
				// render as a line and continue
				segments.push({
					type: PathSegmentType.Line,
					points: [
						simplifiedHullPoints[edgeInds[0]],
						simplifiedHullPoints[(edgeInds[0] + 1) % n],
					],
				});
				continue;
			}

			const curveRunPoints = edgeInds.map(i => simplifiedHullPoints[i]);
			// edges go to pt i + 1 so also add the next point
			curveRunPoints.push(
				simplifiedHullPoints[(edgeInds[edgeInds.length - 1] + 1) % n]
			);

			// open curve path with > 2 points
			const leftTangent = isClosedFreeShape
				? FitCurve.createTangent(
						vec2Arr(curveRunPoints[1]),
						vec2Arr(curveRunPoints[curveRunPoints.length - 2])
				  )
				: FitCurve.createTangent(
						vec2Arr(curveRunPoints[1]),
						vec2Arr(curveRunPoints[0])
				  );
			const rightTangent = isClosedFreeShape
				? leftTangent.map(value => -value)
				: FitCurve.createTangent(
						vec2Arr(curveRunPoints[curveRunPoints.length - 2]),
						vec2Arr(curveRunPoints[curveRunPoints.length - 1])
				  );

			const fitted: PathSegment[] = FitCurve.fitCubic(
				curveRunPoints.map(vec2Arr),
				leftTangent,
				rightTangent,
				this.curveFittingTolerance
			).map(([start, c1, c2, end]) => ({
				type: PathSegmentType.Curve,
				points: [
					arr2Vec(start),
					arr2Vec(c1),
					arr2Vec(c2),
					arr2Vec(end),
				],
			}));

			for (let fit of fitted) {
				if (fit.points.some(({ x, y }) => isNaN(x) || isNaN(y)))
					console.log(
						'NaN detected:\n',
						this.color,
						'\n',
						curveRunPoints,
						'\n',
						leftTangent,
						'\n',
						rightTangent,
						'\n',
						fit,
						'\n',
						curveRunPoints[curveRunPoints.length - 2],
						'\n',
						curveRunPoints[curveRunPoints.length - 1]
					);
			}

			segments.push(...fitted);
		}

		return segments;
	}

	private isBoundaryPoint(pt: Vec2): boolean {
		return this.getBoundarySides(pt).length > 0;
	}

	private getBoundarySides(pt: Vec2): BoundarySide[] {
		const sides: BoundarySide[] = [];
		const eps = 0.5;
		const maxX = this.width - 1;
		const maxY = this.height - 1;

		if (Math.abs(pt.x - 0) <= eps) sides.push(BoundarySide.Left);
		if (Math.abs(pt.x - maxX) <= eps) sides.push(BoundarySide.Right);
		if (Math.abs(pt.y - 0) <= eps) sides.push(BoundarySide.Top);
		if (Math.abs(pt.y - maxY) <= eps) sides.push(BoundarySide.Bottom);

		return sides;
	}

	private putOnSide({ x, y }: Vec2, sides: BoundarySide[]): Vec2 {
		const pt = { x, y };
		if (sides.includes(BoundarySide.Left)) pt.x = 0;
		if (sides.includes(BoundarySide.Right)) pt.x = this.width;
		if (sides.includes(BoundarySide.Top)) pt.y = 0;
		if (sides.includes(BoundarySide.Bottom)) pt.y = this.height;
		return pt;
	}

	private isSamePoint(a: Vec2, b: Vec2): boolean {
		return a.x === b.x && a.y === b.y;
	}

	getPathData(): string {
		if (!this.pathSegments) return '';

		let data: string[] = [];

		const firstCurve = this.pathSegments[0];
		data.push(
			`M ${nf(firstCurve.points[0].x)} ${nf(firstCurve.points[0].y)}`
		);

		for (let { type, points } of this.pathSegments) {
			if (points.some(pt => isNaN(pt.x)))
				console.log(
					'NAN:',
					type === PathSegmentType.Curve,
					points.length
				);
			data.push(
				type === PathSegmentType.Curve
					? `C ${nf(points[1].x)} ${nf(points[1].y)}, ` +
							`${nf((points[2] as Vec2).x)} ${nf(
								(points[2] as Vec2).y
							)}, ` +
							`${nf((points[3] as Vec2).x)} ${nf(
								(points[3] as Vec2).y
							)}`
					: type === PathSegmentType.Line
					? `L ${points[1].x} ${nf(points[1].y)}`
					: ''
			);
		}

		data.push(`Z`);

		return data.join(' ');
	}

	getPathElem(): string {
		// if (!this.isValid) return '';
		// return (
		// 	`<path fill="rgb(${this.color.r},${this.color.g},${this.color.b})" ` +
		// 	`d="${this.getPathData()}" />\n`
		// );

		if (!this.isValid) return '';
		const q =
			`<path fill="rgb(${this.color.r},${this.color.g},${this.color.b})" ` +
			`d="${this.getPathData()}" />\n`;
		return q; //.indexOf('NaN') > -1 ? q : '';
	}
}

var seed = 1;
function random() {
	var x = Math.sin(seed++) * 10000;
	return x - Math.floor(x);
}
