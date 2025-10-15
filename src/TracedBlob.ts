// USED TO BE 'Blob', OVERWROTE THE IMPORTANT BLOB DATA CLASS

import { Hull } from './createHulls';

export class TracedBlob {
	constructor() {}

	makeOutline(src) {
		// get all the black pixels in the image
		src.loadPixels();
		let pts = [];
		for (let y = 0; y < src.height; y += this.resolution) {
			for (let x = 0; x < src.width; x += this.resolution) {
				let index = (y * src.width + x) * 4;

				if (src.pixels[index] > 127) continue;

				pts.push([x, y]);
			}
		}

		const hull = new Hull(pts);
		// this.convexHull = hull(pts, Infinity);

		// hull.js gives points as [x, y], convert to vectors
		for (let i = 0; i < this.outline.length; i++) {
			this.outline[i] = new Vec2D(this.outline[i][0], this.outline[i][1]);
		}
		// for (let i = 0; i < this.convexHull.length; i++) {
		//   this.convexHull[i] = new Vec2D(
		//     this.convexHull[i][0],
		//     this.convexHull[i][1]
		//   );
		// }
	}

	makeCentroid(pts) {
		// via: https://bell0bytes.eu/centroid-convex
		let centroidX = 0;
		let centroidY = 0;
		let determinant = 0;
		let j = 0;
		for (let i = 0; i < pts.length; i++) {
			if (i + 1 === pts.length) {
				j = 0;
			} else {
				j = i + 1;
			}

			let tempDeterminant = pts[i].x * pts[j].y - pts[j].x * pts[i].y;
			determinant += tempDeterminant;

			centroidX += (pts[i].x + pts[j].x) * tempDeterminant;
			centroidY += (pts[i].y + pts[j].y) * tempDeterminant;
		}

		centroidX /= 3 * determinant;
		centroidY /= 3 * determinant;

		this.centroid = new Vec2D(centroidX, centroidY);
	}

	makeBoundingBox(pts) {
		let minX = Number.MAX_VALUE;
		let maxX = Number.MIN_VALUE;
		let minY = Number.MAX_VALUE;
		let maxY = Number.MIN_VALUE;
		for (let pt of pts) {
			if (pt.x < minX) {
				minX = pt.x;
			} else if (pt.x > maxX) {
				maxX = pt.x;
			}
			if (pt.y < minY) {
				minY = pt.y;
			} else if (pt.y > maxY) {
				maxY = pt.y;
			}
		}
		this.bbox = {
			x: minX,
			y: minY,
			w: maxX - minX,
			h: maxY - minY,
		};
	}

	// calculate area using the shoelace formula
	// (can pass in the outline or convex hull)
	getArea(pts) {
		let sum1 = 0;
		let sum2 = 0;
		for (let i = 0; i < pts.length - 1; i++) {
			sum1 = sum1 + pts[i].x * pts[i + 1].y;
			sum2 = sum2 + pts[i].y * pts[i + 1].x;
		}
		sum1 = sum1 + pts[pts.length - 1].x * pts[0].y;
		sum2 = sum2 + pts[0].x * pts[pts.length - 1].y;
		return abs(sum1 - sum2) / 2;
	}
}
