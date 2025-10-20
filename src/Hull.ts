import type { Color, Vec2 } from './types';

import concaveman from 'concaveman';
import simplify from 'simplify-js';
import * as FitCurve from 'fit-curve';
import { nf } from './util';

export class Hull {
        static concavity = 1;

        readonly color: Color;
        readonly hullPoints: Vec2[];
        readonly pathSegments?: PathSegment[];

        private readonly imageWidth: number;
        private readonly imageHeight: number;
        private readonly curveFittingTolerance: number;

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
                this.curveFittingTolerance = curveFittingTolerance;

                const arrayPoints = sampledPoints.map(pt => [pt.x, pt.y]);
                const concaveHull = concaveman(arrayPoints, Hull.concavity, 1).map(([x, y]) => ({
                        x,
                        y,
                }));

                this.hullPoints = this.reducePoints(concaveHull, pathSimplification);
		// more info:
		// https://github.com/mapbox/concaveman

		this.isValid = this.hullPoints.length >= 3;

		if (this.isValid) {
                        this.pathSegments = this.createPathSegments();
                }
        }

        getPathData(): string {
                if (!this.pathSegments || this.pathSegments.length === 0) return '';

                const data: string[] = [];
                const firstSegment = this.pathSegments[0];
                const startPoint = firstSegment.points[0];
                data.push(`M ${nf(startPoint.x)} ${nf(startPoint.y)}`);

                for (const segment of this.pathSegments) {
                        if (segment.type === 'C') {
                                const [, c1, c2, end] = segment.points;
                                data.push(
                                        `C ${nf(c1.x)} ${nf(c1.y)}, ${nf(c2.x)} ${nf(c2.y)}, ${nf(
                                                end.x
                                        )} ${nf(end.y)}`
                                );
                        } else {
                                const [, end] = segment.points;
                                data.push(`L ${nf(end.x)} ${nf(end.y)}`);
                        }
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

        /**
         * Reduces the number of points in a path while maintaining its shape.
         * Ensures that any vertices on the image boundary are preserved.
         */
        reducePoints(points: Vec2[], tolerance: number): Vec2[] {
                const simplified = simplify(points, tolerance, true);
                const simplifiedKeys = new Set(simplified.map(pt => this.pointKey(pt)));
                const boundaryNeighborKeys = new Set<string>();

                for (let i = 0; i < points.length; i++) {
                        if (!this.isBoundaryPoint(points[i])) continue;

                        const prev = points[(i - 1 + points.length) % points.length];
                        const next = points[(i + 1) % points.length];

                        if (!this.isBoundaryPoint(prev)) {
                                boundaryNeighborKeys.add(this.pointKey(prev));
                        }

                        if (!this.isBoundaryPoint(next)) {
                                boundaryNeighborKeys.add(this.pointKey(next));
                        }
                }

                const preserved: Vec2[] = [];

                for (const pt of points) {
                        const key = this.pointKey(pt);
                        if (
                                simplifiedKeys.has(key) ||
                                this.isBoundaryPoint(pt) ||
                                boundaryNeighborKeys.has(key)
                        ) {
                                const last = preserved[preserved.length - 1];
                                if (!last || !this.samePoint(last, pt)) {
                                        preserved.push(pt);
                                }
                        }
                }

                return preserved.length > 0 ? preserved : points;
        }

        private createPathSegments(): PathSegment[] {
                const segments: PathSegment[] = [];
                const points = this.hullPoints;
                const total = points.length;

                if (total < 2) return segments;

                const edgeTypes: ('line' | 'curve')[] = new Array(total);
                for (let i = 0; i < total; i++) {
                        const start = points[i];
                        const end = points[(i + 1) % total];
                        const startSides = this.getBoundarySides(start);
                        const endSides = this.getBoundarySides(end);
                        const shareSide = startSides.some(side => endSides.includes(side));
                        edgeTypes[i] = startSides.length && endSides.length && shareSide ? 'line' : 'curve';
                }

                const vec2Arr = ({ x, y }: Vec2): [number, number] => [x, y];
                const arr2Vec = ([x, y]: [number, number]): Vec2 => ({ x, y });
                const visited = new Array(total).fill(false);

                for (let edgeIndex = 0; edgeIndex < total; edgeIndex++) {
                        if (visited[edgeIndex]) continue;

                        if (edgeTypes[edgeIndex] === 'line') {
                                segments.push({
                                        type: 'L',
                                        points: [
                                                points[edgeIndex],
                                                points[(edgeIndex + 1) % total],
                                        ],
                                });
                                visited[edgeIndex] = true;
                                continue;
                        }

                        const runPoints: Vec2[] = [points[edgeIndex]];
                        let idx = edgeIndex;
                        let isClosedRun = false;

                        while (!visited[idx] && edgeTypes[idx] === 'curve') {
                                visited[idx] = true;
                                idx = (idx + 1) % total;
                                runPoints.push(points[idx]);

                                if (idx === edgeIndex) {
                                        isClosedRun = true;
                                        break;
                                }

                                if (edgeTypes[idx] === 'line') {
                                        break;
                                }
                        }

                        if (isClosedRun && this.samePoint(runPoints[0], runPoints[runPoints.length - 1])) {
                                runPoints.pop();
                        }

                        if (runPoints.length === 2) {
                                segments.push({
                                        type: 'L',
                                        points: [runPoints[0], runPoints[1]],
                                });
                                continue;
                        }

                        const leftTangent = isClosedRun
                                ? FitCurve.createTangent(
                                          vec2Arr(runPoints[1]),
                                          vec2Arr(runPoints[runPoints.length - 2])
                                  )
                                : FitCurve.createTangent(
                                          vec2Arr(runPoints[1]),
                                          vec2Arr(runPoints[0])
                                  );
                        const rightTangent = isClosedRun
                                ? leftTangent.map(value => -value) as [number, number]
                                : FitCurve.createTangent(
                                          vec2Arr(runPoints[runPoints.length - 2]),
                                          vec2Arr(runPoints[runPoints.length - 1])
                                  );

                        const fitted = FitCurve.fitCubic(
                                runPoints.map(vec2Arr),
                                leftTangent,
                                rightTangent,
                                this.curveFittingTolerance
                        ).map(([start, c1, c2, end]) => ({
                                type: 'C' as const,
                                points: [
                                        arr2Vec(start),
                                        arr2Vec(c1),
                                        arr2Vec(c2),
                                        arr2Vec(end),
                                ],
                        }));

                        segments.push(...fitted);
                }

                return segments;
        }

        private isBoundaryPoint(pt: Vec2): boolean {
                return this.getBoundarySides(pt).length > 0;
        }

        private getBoundarySides(pt: Vec2): BoundarySide[] {
                const sides: BoundarySide[] = [];
                const maxX = this.imageWidth - 1;
                const maxY = this.imageHeight - 1;

                if (this.isOnBoundary(pt.x, 0)) sides.push('LEFT');
                if (this.isOnBoundary(pt.x, maxX)) sides.push('RIGHT');
                if (this.isOnBoundary(pt.y, 0)) sides.push('TOP');
                if (this.isOnBoundary(pt.y, maxY)) sides.push('BOTTOM');

                return sides;
        }

        private isOnBoundary(value: number, boundary: number): boolean {
                const rounded = Math.round(value);
                if (rounded !== boundary) return false;

                const tolerance = 1e-3;
                return Math.abs(value - rounded) <= tolerance;
        }

        private pointKey({ x, y }: Vec2): string {
                return `${x}:${y}`;
        }

        private samePoint(a: Vec2, b: Vec2): boolean {
                return a.x === b.x && a.y === b.y;
        }
}

type BoundarySide = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

type PathSegment =
        | { type: 'L'; points: [Vec2, Vec2] }
        | { type: 'C'; points: [Vec2, Vec2, Vec2, Vec2] };
