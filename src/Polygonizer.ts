import type p5 from 'p5';
import { Point } from './types';
import { Polygon } from './Polygon';
class Polygonizer {
	constructor(sketch: p5, pg: p5.Graphics, offset = 0, nPointsApprox = 100) {
		let pgCopy = sketch.createGraphics(pg.width, pg.height);

		pgCopy.background(255);
		pgCopy.image(pg, 0, 0);
		pgCopy.filter(sketch.BLUR, 1);
		pgCopy.filter(sketch.ERODE);
		pgCopy.filter(sketch.DILATE);
		pgCopy.filter(sketch.THRESHOLD, 1 - 2 / 255);
		// this.pg = pgCopy;

		const minWH = sketch.min(pgCopy.width, pgCopy.height);
		const res = sketch.round(minWH * 0.003);
		this.blob = new Blobby(pgCopy, 20, res);
		// print(this.blob);

		let poly = new Polygon(this.blob.outline.map(p => new Vec2D(p.x, p.y)));

		if (!poly.isClockwise()) {
			print('flipping order');
			poly.flipVertexOrder();
		}

		// const minLen = res * 10;//round(winWH * 0.003);

		const minLen = poly.getCircumference() / nPointsApprox; //res * 10;//round(winWH * 0.003);
		poly.reduceVertices(minLen);

		// poly.offsetShape(pw * 0.1);

		// print(poly);
		this.poly = poly;
	}
}

function sdPolygon(pt, poly) {
	let sd = Infinity;
	for (let edge of poly.getEdges()) {
		let sdEdge = edge.distanceToPoint(pt);
		sd = min(sd, sdEdge);
	}
	const isInside = poly.containsPoint(pt);
	// return sd * (isInside ? -1 : 1);
	return isInside ? -pw * 0.5 : sd;
}
function sdPolygonNorm(pt, poly) {
	return sdPolygon(pt, poly) / min(pw, ph);
}

function sdPolygonOutline(pt, poly) {
	let sd = Infinity;
	for (let edge of poly.getEdges()) {
		let sdEdge = edge.distanceToPoint(pt);
		sd = min(sd, sdEdge);
	}
	return sd;
}
function sdPolygonOutlineNorm(pt, poly) {
	return sdPolygonOutline(pt, poly) / min(pw, ph);
}
