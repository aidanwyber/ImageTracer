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

export interface SmoothingOptions {
	isClosed?: boolean;
	alpha?: number;
	minLength?: number;
	chaikinSteps?: number;
}
