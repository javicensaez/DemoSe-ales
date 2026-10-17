'use strict';

const rectangleWidths = [0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1];
const rectanglesWidthSlider = document.querySelector('#rectangles-width');
const rectanglesSourcePlot = document.querySelector('#rectangles-source-plot');
const rectanglesResultPlot = document.querySelector('#rectangles-result-plot');
const rectanglesTimeFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rectanglesErrorFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const rectanglesTickFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 1 });
const rectanglesSignal = t => 0.9 * Math.sin(2 * Math.PI * 0.45 * t) + 0.35 * Math.cos(2 * Math.PI * 1.1 * t) + 0.2 * Math.sin(2 * Math.PI * 1.8 * t + 0.4);
const rectanglesSourcePoints = Array.from({ length: 2401 }, (_, index) => ({ t: index / 400, value: rectanglesSignal(index / 400) }));

function rectanglesBuild(width) {
  return Array.from({ length: Math.round(6 / width) }, (_, index) => {
    const left = index * width, right = (index + 1) * width;
    return { left, right, value: rectanglesSignal(left) };
  });
}

function rectanglesRms(pulses) {
  // Puntos medios de una malla más fina, independientes de los instantes de muestreo.
  const count = 12000, width = 6 / pulses.length;
  let error = 0;
  for (let index = 0; index < count; index++) {
    const t = (index + 0.5) * 6 / count;
    const pulse = pulses[Math.min(pulses.length - 1, Math.floor(t / width))];
    error += (rectanglesSignal(t) - pulse.value) ** 2;
  }
  return Math.sqrt(error / count);
}

function rectanglesCoordinates(plot) {
  const width = Math.max(240, plot.clientWidth), height = Math.max(230, plot.clientHeight);
  plot.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const left = 55, right = width - 16, top = 28, bottom = height - 42;
  return { width, height, left, right, top, bottom,
    x: t => left + t / 6 * (right - left),
    y: value => top + (1.5 - value) / 3 * (bottom - top),
  };
}

function rectanglesGrid(coords, title) {
  const { left, right, top, bottom, x, y, height } = coords;
  let svg = `<title>${title}</title>`;
  for (let time = 0; time <= 6; time++) {
    svg += `<line class="${time === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${x(time)}" x2="${x(time)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(time)}" y="${bottom + 18}" text-anchor="middle">${time}</text>`;
  }
  for (let step = -3; step <= 3; step++) {
    const value = step / 2;
    svg += `<line class="${value === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}"/><text class="plot-tick-label" x="${left - 8}" y="${y(value) + 4}" text-anchor="end">${rectanglesTickFormat.format(value)}</text>`;
  }
  return svg + `<text class="plot-axis-label" x="${left}" y="17">Amplitud (u.a.)</text><text class="plot-axis-label" x="${right}" y="${height - 3}" text-anchor="end">Tiempo (s)</text>`;
}

function rectanglesPath(points, coords) {
  return points.map((point, index) => `${index ? 'L' : 'M'}${coords.x(point.t).toFixed(2)},${coords.y(point.value).toFixed(2)}`).join(' ');
}

let rectanglesCurrentWidth;
let rectanglesCurrentPulses;
function rectanglesDraw() {
  const width = rectangleWidths[Number(rectanglesWidthSlider.value)];
  if (width !== rectanglesCurrentWidth) {
    rectanglesCurrentWidth = width;
    rectanglesCurrentPulses = rectanglesBuild(width);
    document.querySelector('#rectangles-count').textContent = String(rectanglesCurrentPulses.length);
    document.querySelector('#rectangles-error').textContent = `${rectanglesErrorFormat.format(rectanglesRms(rectanglesCurrentPulses))} u.a.`;
  }
  const pulses = rectanglesCurrentPulses;
  const widthText = rectanglesTimeFormat.format(width);
  document.querySelector('#rectangles-width-value').textContent = `${widthText} s`;
  rectanglesWidthSlider.setAttribute('aria-valuetext', `${widthText} segundos por pulso`);
  const original = rectanglesCoordinates(rectanglesSourcePlot), result = rectanglesCoordinates(rectanglesResultPlot);
  rectanglesSourcePlot.innerHTML = rectanglesGrid(original, 'Señal analógica simulada')
    + `<path class="rectangles-original-line" d="${rectanglesPath(rectanglesSourcePoints, original)}" fill="none" stroke="var(--wave)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`;
  const contour = [];
  let svg = rectanglesGrid(result, `Aproximación por ${pulses.length} pulsos rectangulares`);
  for (const pulse of pulses) {
    const rectangle = [{ t: pulse.left, value: 0 }, { t: pulse.left, value: pulse.value }, { t: pulse.right, value: pulse.value }, { t: pulse.right, value: 0 }];
    svg += `<path class="rectangles-pulse" d="${rectanglesPath(rectangle, result)}Z" fill="var(--answer)" fill-opacity="0.13" stroke="var(--answer)" stroke-opacity="0.5" stroke-width="0.8"/>`;
    contour.push({ t: pulse.left, value: pulse.value }, { t: pulse.right, value: pulse.value });
  }
  svg += `<path class="rectangles-step-line" d="${rectanglesPath(contour, result)}" fill="none" stroke="var(--answer)" stroke-width="2" vector-effect="non-scaling-stroke"/>`
    + `<path class="rectangles-reference-line" d="${rectanglesPath(rectanglesSourcePoints, result)}" fill="none" stroke="var(--wave)" stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>`;
  rectanglesResultPlot.innerHTML = svg;
  document.querySelector('#rectangles-result-description').textContent = `${pulses.length} rectángulos de ${widthText} s, con el vértice izquierdo de la altura de cada pulso sobre la curva original. La línea discontinua permite comparar con la señal original.`;
  rectanglesResultPlot.setAttribute('aria-label', `Aproximación con ${pulses.length} rectángulos de ${widthText} segundos y señal original discontinua. Tiempo de cero a seis segundos y amplitud de −1,5 a 1,5 unidades arbitrarias, misma escala que la gráfica superior.`);
}
rectanglesWidthSlider.addEventListener('input', rectanglesDraw);
rectanglesDraw();
let rectanglesResizeFrame;
const rectanglesResize = new ResizeObserver(() => {
  cancelAnimationFrame(rectanglesResizeFrame);
  rectanglesResizeFrame = requestAnimationFrame(rectanglesDraw);
});
rectanglesResize.observe(rectanglesSourcePlot);
rectanglesResize.observe(rectanglesResultPlot);
