import concaveman from 'concaveman';

test('concaveman generates a concave hull', () => {
	// concave polygon that look like a square with point in middle
	const points = [
		[0, 0],
		[10, 0],
		[10, 10],
		[0, 10],
		[5, 5],
	];

	const hull = concaveman(points);

	// hull should be a simplified polygon enclosing the points
	expect(Array.isArray(hull)).toBe(true);
	expect(hull.length).toBeGreaterThan(3);
});
