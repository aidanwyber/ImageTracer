type Vec2 = {
    x: number;
    y: number;
};
type Color = {
    r: number;
    g: number;
    b: number;
};
interface ImageDataLike {
    data: ArrayLike<number>;
    width: number;
    height: number;
}
interface ImageTraceOptions {
    smoothingMinLength: number;
    chaikinSmoothingSteps: number;
    pixelGridStepSize?: number;
    debugPointRadius?: number;
}
interface SmoothingOptions {
    isClosed?: boolean;
    alpha?: number;
    minLength?: number;
    chaikinSteps?: number;
}

declare class Hull {
    static concavity: number;
    static lengthThreshold: number;
    readonly color: Color;
    readonly sampledPoints: Vec2[];
    readonly hullPoints: Vec2[];
    constructor(color: Color, sampledPoints: Vec2[], smoothingMinLength: number);
    /**
     * Reduces the number of points in a path while maintaining its shape
     */
    reducePoints(points: Vec2[], minDist: number): Vec2[];
}

/**
 * ImageTrace converts raster images to vector graphics by detecting and tracing
 * color-matched regions into SVG paths.
 */
declare class ImageTrace {
    readonly width: number;
    readonly height: number;
    readonly smoothingMinLength: number;
    readonly chaikinSmoothingSteps: number;
    readonly pixelGridStepSize: number;
    readonly hulls: Hull[];
    readonly debugPointRadius: number | undefined;
    /**
     * Creates a new ImageTrace instance
     *
     * @param imageData - The source image data to trace
     * @param palette - Array of colors to match against
     * @param options - Configuration options for tracing
     * @throws {Error} If imageData or palette is invalid
     */
    constructor(imageData: ImageDataLike, palette: Color[], options: ImageTraceOptions);
    /**
     * Retrieves a hull by its color
     */
    getHullByColor(color: Color): Hull | undefined;
    /**
     * Generates an SVG string representation of the traced image
     */
    getSVGString(): string;
    private createHullsFromPalette;
    private createHullForColor;
    private createMaskPointCloud;
    private createPathElement;
    private createPointElements;
    private pixelMatches;
    private colorsMatch;
}

declare function createConvexHullPoints(pointCloud: Vec2[]): Vec2[];

export { type Color, Hull, type ImageDataLike, ImageTrace, type ImageTraceOptions, type SmoothingOptions, type Vec2, createConvexHullPoints };
