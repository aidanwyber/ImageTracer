# ImageTracer

Blob detection and image tracing, functionalities attempting to match those of Adobe Illustrator.

## About

This project implements blob detection and image tracing capabilities similar to Adobe Illustrator's functionality. The core blob detection algorithm is inspired by Jeff Thompson's work, which provides an excellent middle ground between simple color detection and complex neural network-based object detection.

## Credits

This implementation builds upon Jeff Thompson's blob detection work:

-   [CP2: Blob Detection – Webcam Tracking in p5.js](https://www.youtube.com/watch?v=G7u26vfiUX8)
-   [Original p5.js implementation](https://editor.p5js.org/jeffThompson/sketches/rFeSWevtU) by Jeff Thompson (2021)
-   More of Jeff's work at [jeffreythompson.org](http://jeffreythompson.org)

### Hull.js Implementation

This project includes a re-implementation of Hull.js, originally created by Andrii Heonia:

-   Original repository: [Hull.js](https://github.com/AndriiHeonia/hull)
-   Author: [Andrii Heonia](https://github.com/AndriiHeonia)
-   License: MIT
-   Description: A JavaScript library that builds concave/convex hull by set of points

## Technical Details

The blob detection algorithm looks for areas of black in a thresholded image, providing a balance between:

-   Simple color detection using basic p5.js commands
-   Complex object detection using neural networks

### Dependencies

-   Hull.js functionality (re-implemented from Andrii Heonia's original work)
    -   Used for calculating convex hulls around detected blobs
    -   Implementation modified for integration with our blob detection system
    -   Original source: [Hull.js GitHub Repository](https://github.com/AndriiHeonia/hull)

### Notes

-   Performance may vary depending on image size and complexity
-   For optimal performance, consider running locally rather than in web-based editors
-   Real-time video processing may require additional optimization
