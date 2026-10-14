const timeBounds = [-4, 4];
const integrationBounds = [-8, 8];
const integrationIntervals = 1600;
const curveColors = {
  x: "#164b8c",
  h: "#1479bd",
  product: "#d97706",
  result: "#2878b9",
  marker: "#526a7c",
};

const signalOptions = {
  step: {
    name: "Escalón u(t)",
    value: (time) => (time >= 0 ? 1 : 0),
    max: 1,
    causal: true,
  },
  rect: {
    name: "Pulso positivo [0, 1]",
    value: (time) => (time >= 0 && time < 1 ? 1 : 0),
    max: 1,
    causal: true,
  },
  "positive-left-pulse": {
    name: "Pulso positivo [−1, 0)",
    value: (time) => (time >= -1 && time < 0 ? 1 : 0),
    max: 1,
    causal: false,
  },
  "negative-pulse": {
    name: "Pulso negativo [0, 1)",
    value: (time) => (time >= 0 && time < 1 ? -1 : 0),
    min: -1,
    max: 0,
    causal: true,
  },
  "bipolar-pulse": {
    name: "Pulso bipolar: +1 en [−1, 0), −1 en [0, 1)",
    value: (time) => (time >= -1 && time < 0 ? 1 : time >= 0 && time < 1 ? -1 : 0),
    min: -1,
    max: 1,
    causal: false,
  },
  "centered-pulse": {
    name: "Pulso de anchura 2 centrado en 0",
    value: (time) => (time >= -1 && time < 1 ? 1 : 0),
    max: 1,
    causal: false,
  },
  triangle: {
    name: "Triangular centrada",
    value: (time) => Math.max(0, 1 - Math.abs(time)),
    max: 1,
    causal: false,
  },
  ramp: {
    name: "Rampa causal truncada",
    value: (time) => (time >= 0 && time < 2 ? time / 2 : 0),
    max: 1,
    causal: true,
  },
  exponential: {
    name: "Exponencial causal e⁻ᵗu(t)",
    value: (time) => (time >= 0 ? Math.exp(-time) : 0),
    max: 1,
    causal: true,
  },
};

const xSelect = document.querySelector("#x-signal");
const hSelect = document.querySelector("#h-signal");
const timeSlider = document.querySelector("#time-slider");
const timeOutput = document.querySelector("#time-value");
const resultTime = document.querySelector("#result-time");
const resultValue = document.querySelector("#result-value");
const convolutionDefinition = document.querySelector("#convolution-definition");
const convolutionDefinitionNote = document.querySelector("#convolution-definition-note");
const convolutionResultFormula = document.querySelector("#convolution-result-formula");
const xOriginalPlot = document.querySelector("#x-original-plot");
const hOriginalPlot = document.querySelector("#h-original-plot");
const overlapPlot = document.querySelector("#overlap-plot");
const resultPlot = document.querySelector("#result-plot");
let displayedFormulaMode = null;

function updateConvolutionFormula(hSignal) {
  const formulaMode = hSignal.causal ? "causal" : "general";
  if (formulaMode === displayedFormulaMode) return;

  window.MathJax.typesetClear([convolutionDefinition, convolutionResultFormula]);
  const upperLimit = hSignal.causal ? "t" : "\\infty";
  convolutionDefinition.innerHTML =
    `\\(y(t)=x(t)*h(t)=\\displaystyle\\int_{-\\infty}^{${upperLimit}}x(\\tau)\\,h(t-\\tau)\\,\\mathrm{d}\\tau\\)`;
  convolutionResultFormula.innerHTML =
    `\\(y(t)\\approx\\int_{-\\infty}^{${upperLimit}}x(\\tau)h(t-\\tau)\\,\\mathrm{d}\\tau=\\)`;
  convolutionDefinitionNote.textContent = hSignal.causal
    ? "Como h(t) es causal, la integral puede terminar en t. El área coloreada representa el valor aproximado de la integral."
    : "Como h(t) no es causal, se integra sobre todo el eje temporal. El área coloreada representa el valor aproximado de la integral.";
  displayedFormulaMode = formulaMode;
  window.MathJax.typesetPromise([convolutionDefinition, convolutionResultFormula]);
}

function integrateProduct(xSignal, hSignal, time) {
  const step = (integrationBounds[1] - integrationBounds[0]) / integrationIntervals;
  let integral = 0;
  for (let index = 0; index < integrationIntervals; index += 1) {
    const tau = integrationBounds[0] + (index + 0.5) * step;
    integral += xSignal.value(tau) * hSignal.value(time - tau) * step;
  }
  return integral;
}

function formatNumber(value) {
  return Number(value.toFixed(3)).toString();
}

function signalYRange(signal) {
  return [Math.min(-0.2, (signal.min ?? 0) * 1.2), Math.max(0.2, signal.max * 1.2)];
}

function signalYTicks(signal) {
  return signal.min === undefined
    ? [0, 0.5, 1]
    : [signalYRange(signal)[0], 0, signalYRange(signal)[1]];
}

function productBounds(xSignal, hSignal) {
  const products = [
    (xSignal.min ?? 0) * (hSignal.min ?? 0),
    (xSignal.min ?? 0) * hSignal.max,
    xSignal.max * (hSignal.min ?? 0),
    xSignal.max * hSignal.max,
  ];
  return [Math.min(...products), Math.max(...products)];
}

function chartMarkup({
  curves,
  xLabel,
  yLabel,
  xRange,
  yRange,
  xTicks,
  yTicks,
  markerX = null,
  fillCurveIndex = null,
}) {
  const width = 800;
  const height = 300;
  const margin = { top: 22, right: 24, bottom: 42, left: 58 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = (value) =>
    margin.left + ((value - xRange[0]) / (xRange[1] - xRange[0])) * plotWidth;
  const y = (value) =>
    margin.top + ((yRange[1] - value) / (yRange[1] - yRange[0])) * plotHeight;
  const parts = [];

  for (const tick of xTicks) {
    parts.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height - margin.bottom}" />
      <text class="plot-tick-label" x="${x(tick)}" y="${height - 15}" text-anchor="middle">${formatNumber(tick)}</text>
    `);
  }
  for (const tick of yTicks) {
    parts.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}" />
      <text class="plot-tick-label" x="${margin.left - 12}" y="${y(tick) + 4}" text-anchor="end">${formatNumber(tick)}</text>
    `);
  }

  const sampleCount = 801;
  for (const [curveIndex, curve] of curves.entries()) {
    const points = [];
    for (let index = 0; index < sampleCount; index += 1) {
      const time = xRange[0] + ((xRange[1] - xRange[0]) * index) / (sampleCount - 1);
      points.push([x(time), y(curve.value(time))]);
    }
    const path = points
      .map(([pointX, pointY], index) =>
        `${index === 0 ? "M" : "L"}${pointX.toFixed(2)},${pointY.toFixed(2)}`,
      )
      .join(" ");
    if (fillCurveIndex === curveIndex) {
      const areaPath = `${path} L${x(xRange[1]).toFixed(2)},${y(0).toFixed(2)} L${x(xRange[0]).toFixed(2)},${y(0).toFixed(2)} Z`;
      parts.push(`<path d="${areaPath}" fill="${curve.color}" fill-opacity="0.2" stroke="none" />`);
    }
    parts.push(`<path d="${path}" fill="none" stroke="${curve.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />`);
  }

  if (markerX !== null && markerX >= xRange[0] && markerX <= xRange[1]) {
    parts.push(`<line x1="${x(markerX)}" y1="${margin.top}" x2="${x(markerX)}" y2="${height - margin.bottom}" stroke="${curveColors.marker}" stroke-width="2" stroke-dasharray="6 5" />`);
  }

  parts.push(`
    <text class="plot-axis-label" x="${width - margin.right}" y="${height - 3}" text-anchor="end">${xLabel}</text>
    <text class="plot-axis-label" x="14" y="${margin.top}" text-anchor="start">${yLabel}</text>
  `);
  return parts.join("");
}

function render() {
  const xSignal = signalOptions[xSelect.value];
  const hSignal = signalOptions[hSelect.value];
  updateConvolutionFormula(hSignal);
  const time = Number(timeSlider.value);
  const shiftedH = (tau) => hSignal.value(time - tau);
  const product = (tau) => xSignal.value(tau) * shiftedH(tau);
  const currentValue = integrateProduct(xSignal, hSignal, time);
  const standardTimeTicks = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  const integrationTimeTicks = [-8, -6, -4, -2, 0, 2, 4, 6, 8];
  const resultSamples = [];

  for (let index = 0; index <= 320; index += 1) {
    const sampleTime = integrationBounds[0] +
      ((integrationBounds[1] - integrationBounds[0]) * index) / 320;
    resultSamples.push({
      time: sampleTime,
      value: integrateProduct(xSignal, hSignal, sampleTime),
    });
  }

  const convolutionMinimum = Math.min(...resultSamples.map((sample) => sample.value));
  const convolutionMaximum = Math.max(...resultSamples.map((sample) => sample.value));
  const [productMinimum, productMaximum] = productBounds(xSignal, hSignal);
  const signalMinimum = Math.min(xSignal.min ?? 0, hSignal.min ?? 0, productMinimum);
  const signalMaximum = Math.max(xSignal.max, hSignal.max, productMaximum);
  const sharedMinimum = Math.min(0, signalMinimum, convolutionMinimum);
  const sharedMaximum = Math.max(0, signalMaximum, convolutionMaximum);
  const sharedYRange = [
    sharedMinimum < 0 ? sharedMinimum * 1.2 : -0.2,
    sharedMaximum > 0 ? sharedMaximum * 1.2 : 0.2,
  ];
  const sharedYTicks = sharedMinimum < 0
    ? [sharedYRange[0], 0, sharedYRange[1]]
    : [0, sharedYRange[1] / 2, sharedYRange[1]];
  const resultCurve = (sampleTime) => {
    const position =
      ((sampleTime - integrationBounds[0]) /
        (integrationBounds[1] - integrationBounds[0])) *
      (resultSamples.length - 1);
    const leftIndex = Math.max(0, Math.min(resultSamples.length - 1, Math.floor(position)));
    const rightIndex = Math.min(resultSamples.length - 1, leftIndex + 1);
    const fraction = position - leftIndex;
    return (
      resultSamples[leftIndex].value * (1 - fraction) +
      resultSamples[rightIndex].value * fraction
    );
  };

  timeOutput.value = formatNumber(time);
  timeOutput.textContent = formatNumber(time);
  resultTime.textContent = formatNumber(time);
  resultValue.textContent = formatNumber(currentValue);

  xOriginalPlot.innerHTML = chartMarkup({
    curves: [{ value: xSignal.value, color: curveColors.x }],
    xLabel: "t",
    yLabel: "x(t)",
    xRange: timeBounds,
    yRange: signalYRange(xSignal),
    xTicks: standardTimeTicks,
    yTicks: signalYTicks(xSignal),
  });
  xOriginalPlot.setAttribute("aria-label", `Señal original x de tipo ${xSignal.name}`);

  hOriginalPlot.innerHTML = chartMarkup({
    curves: [{ value: hSignal.value, color: curveColors.h }],
    xLabel: "t",
    yLabel: "h(t)",
    xRange: timeBounds,
    yRange: signalYRange(hSignal),
    xTicks: standardTimeTicks,
    yTicks: signalYTicks(hSignal),
  });
  hOriginalPlot.setAttribute("aria-label", `Respuesta al impulso h de tipo ${hSignal.name}`);

  overlapPlot.innerHTML = chartMarkup({
    curves: [
      { value: xSignal.value, color: curveColors.x },
      { value: shiftedH, color: curveColors.h },
      { value: product, color: curveColors.product },
    ],
    xLabel: "τ",
    yLabel: "amplitud",
    xRange: integrationBounds,
    yRange: sharedYRange,
    xTicks: integrationTimeTicks,
    yTicks: sharedYTicks,
    markerX: time,
    fillCurveIndex: 2,
  });
  overlapPlot.setAttribute(
    "aria-label",
    `Señales x de tau, h de t menos tau y su producto superpuestas para t igual a ${formatNumber(time)}`,
  );

  resultPlot.innerHTML = chartMarkup({
    curves: [{ value: resultCurve, color: curveColors.result }],
    xLabel: "t",
    yLabel: "y(t)",
    xRange: integrationBounds,
    yRange: sharedYRange,
    xTicks: integrationTimeTicks,
    yTicks: sharedYTicks,
    markerX: time,
  });
  resultPlot.setAttribute("aria-label", `Convolución y de t; valor actual ${formatNumber(currentValue)}`);
}

xSelect.addEventListener("change", render);
hSelect.addEventListener("change", render);
timeSlider.addEventListener("input", render);

render();
