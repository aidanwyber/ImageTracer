export type Vec2 = { x: number; y: number };

export type Color = { r: number; g: number; b: number };
export interface ImageDataLike {
	data: ArrayLike<number>;
	width: number;
	height: number;
}

export interface ImageTraceOptions {
	pathSimplificationTolerance: number;
	curveFittingTolerance: number;
	minHullDistance?: number;
	pixelGridStepSize?: number;
	debugPointRadius?: number;
}

export enum PathSegmentType {
	Line,
	Curve,
}

export type PathSegment =
	| { type: PathSegmentType.Line; points: [Vec2, Vec2] }
	| { type: PathSegmentType.Curve; points: [Vec2, Vec2, Vec2, Vec2] };

export enum BoundarySide {
	Top,
	Bottom,
	Left,
	Right,
}
