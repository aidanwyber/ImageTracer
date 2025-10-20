console.log('test');
import { ImageTrace } from '../dist/index.js';

const img = document.getElementById('source-image');
const uploadInput = document.getElementById('image-upload');
const canvas = document.getElementById('work-canvas');
const ctx = canvas.getContext('2d');
const traceButton = document.getElementById('trace-button');
const downloadButton = document.getElementById('download-button');
const status = document.getElementById('status');
const paletteInfo = document.getElementById('palette-info');
const svgOutput = document.getElementById('svg-output');

const controls = {
	colorStep: document.getElementById('color-step'),
	pathSimplification: document.getElementById('path-simplification'),
	curveFitting: document.getElementById('curve-fitting'),
	minHull: document.getElementById('min-hull'),
	pixelStep: document.getElementById('pixel-step'),
};

const controlLabels = {
	colorStep: document.getElementById('color-step-value'),
	pathSimplification: document.getElementById('path-simplification-value'),
	curveFitting: document.getElementById('curve-fitting-value'),
	minHull: document.getElementById('min-hull-value'),
	pixelStep: document.getElementById('pixel-step-value'),
};

let lastTrace = null;
let pendingObjectUrl = null;
let debounceHandle = null;

function formatValue(key, value) {
	switch (key) {
		case 'colorStep':
		case 'pixelStep':
		case 'minHull':
			return Math.round(value);
		default:
			return Number.parseFloat(value).toFixed(1);
	}
}

function updateLabels() {
	for (const [key, input] of Object.entries(controls)) {
		controlLabels[key].textContent = formatValue(key, input.value);
	}
}

function extractPalette(imageData, step) {
	const palette = new Map();
	const roundedStep = Math.max(1, Number(step) || 1);
	const { data } = imageData;
	for (let i = 0; i < data.length; i += 4) {
		const alpha = data[i + 3];
		if (alpha < 32) continue;
		const r = Math.min(
			255,
			Math.round(data[i] / roundedStep) * roundedStep
		);
		const g = Math.min(
			255,
			Math.round(data[i + 1] / roundedStep) * roundedStep
		);
		const b = Math.min(
			255,
			Math.round(data[i + 2] / roundedStep) * roundedStep
		);
		const key = `${r},${g},${b}`;
		if (!palette.has(key)) {
			palette.set(key, { r, g, b });
		}
	}
	return Array.from(palette.values());
}

function getImageData() {
	if (!img.complete || img.naturalWidth === 0) {
		throw new Error('Image is still loading');
	}
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, 0, 0);
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function scheduleTrace() {
	clearTimeout(debounceHandle);
	debounceHandle = setTimeout(() => {
		traceImage();
	}, 120);
}

function traceImage() {
	clearTimeout(debounceHandle);
	status.textContent = 'Tracing…';
	paletteInfo.textContent = '';
	svgOutput.innerHTML = '';
	downloadButton.disabled = true;

	try {
		const imageData = getImageData();
		const colorStep = Number(controls.colorStep.value);
		const palette = extractPalette(imageData, colorStep);

		if (!palette.length) {
			throw new Error('No opaque pixels were found in the image.');
		}

		const options = {
			pathSimplificationTolerance: Number(
				controls.pathSimplification.value
			),
			curveFittingTolerance: Number(controls.curveFitting.value),
			minHullDistance: Number(controls.minHull.value),
			pixelGridStepSize: Number(controls.pixelStep.value),
		};

		if (options.pixelGridStepSize > options.minHullDistance) {
			throw new Error(
				'Pixel grid step size must not exceed the minimum hull distance.'
			);
		}

		const tracer = new ImageTrace(imageData, palette, options);
		const svgString = tracer.getSVGString();
		svgOutput.innerHTML = svgString;
		const svgElement = svgOutput.querySelector('svg');
		if (svgElement) {
			svgElement.setAttribute(
				'viewBox',
				`0 0 ${imageData.width} ${imageData.height}`
			);
		}
		paletteInfo.textContent = `Palette size: ${palette.length} colours`;
		status.textContent = `Tracing complete (${imageData.width}×${imageData.height}).`;
		downloadButton.disabled = false;
		lastTrace = tracer;
	} catch (error) {
		console.error(error);
		status.textContent = error.message ?? String(error);
		lastTrace = null;
	}
}

function handleUpload(event) {
	const file = event.target.files?.[0];
	if (!file) return;
	if (pendingObjectUrl) {
		URL.revokeObjectURL(pendingObjectUrl);
	}
	const objectUrl = URL.createObjectURL(file);
	pendingObjectUrl = objectUrl;
	img.src = objectUrl;
}

function init() {
	updateLabels();
	traceButton.addEventListener('click', () => traceImage());
	downloadButton.addEventListener('click', () => {
		if (lastTrace) {
			lastTrace.downloadSVG('trace-result.svg');
		}
	});

	for (const input of Object.values(controls)) {
		input.addEventListener('input', () => {
			updateLabels();
			scheduleTrace();
		});
	}

	uploadInput.addEventListener('change', handleUpload);
	img.addEventListener('load', () => {
		scheduleTrace();
	});
	img.addEventListener('error', () => {
		status.textContent = 'Could not load the image.';
	});

	if (img.complete) {
		scheduleTrace();
	}
}

init();
