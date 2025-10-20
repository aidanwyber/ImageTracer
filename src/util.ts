export function nf(x: number, precision = 3): string {
	const k10 = 10 ** precision;
	return (Math.round(x * k10) / k10).toString();
}
