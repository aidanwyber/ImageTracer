export type Vec2 = { x: number; y: number };

export type Color = { r: number; g: number; b: number };
export interface ImageDataLike {
	data: ArrayLike<number>;
	width: number;
	height: number;
}

export interface ImageTracerOptions {
	smoothingMinLength: number;
	chaikinSmoothingSteps: number;
	pixelGridStepSize?: number;
	debugPointRadius?: number;
}

export interface SmoothingOptions {
	isClosed?: boolean;
	alpha?: number;
	minLength?: number;
	chaikinSteps?: number;
}
