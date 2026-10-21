const signalDefinitions = {
  sine: {
    name: "Seno",
    bandlimited: true,
    frequencies: (baseFrequency) => [baseFrequency],
    value: (time, frequency) => Math.sin(2 * Math.PI * frequency * time),
  },
  cosine: {
    name: "Coseno",
    bandlimited: true,
    frequencies: (baseFrequency) => [baseFrequency],
    value: (time, frequency) => Math.cos(2 * Math.PI * frequency * time),
  },
  "two-tone": {
    name: "Suma de dos tonos",
    bandlimited: true,
    frequencies: (baseFrequency) => [baseFrequency, 2 * baseFrequency],
    value: (time, frequency) =>
      Math.sin(2 * Math.PI * frequency * time) +
      0.5 * Math.sin(4 * Math.PI * frequency * time),
  },
  square: {
    name: "Rectangular periódica (duty 50 %)",
    bandlimited: false,
    frequencies: (baseFrequency) => [baseFrequency],
    value: (time, frequency) => {
      const phase = ((time * frequency) % 1 + 1) % 1;
      return phase < 0.5 ? 1 : -1;
    },
  },
  triangle: {
    name: "Triangular periódica",
    bandlimited: false,
    frequencies: (baseFrequency) => [baseFrequency],
    value: (time, frequency) => {
      const phase = ((time * frequency) % 1 + 1) % 1;
      return 1 - 4 * Math.abs(phase - 0.5);
    },
  },
};

const timeRange = [-1.5, 1.5];
let plotWidth = 800;
const plotHeight = 320;
const margins = { top: 24, right: 24, bottom: 42, left: 58 };
const sampleCount = 601;
const sincGuardSamples = 100;

const signalSelect = document.querySelector("#sampling-signal");
const signalFrequency = document.querySelector("#signal-frequency");
const samplingFrequency = document.querySelector("#sampling-frequency");
const signalFrequencyOutput = document.querySelector("#signal-frequency-value");
const samplingFrequencyOutput = document.querySelector("#sampling-frequency-value");
const sampledPlot = document.querySelector("#sampled-plot");

function formatNumber(value, digits = 2) {
  return Number(value.toFixed(digits)).toString();
}

function sinc(value) {
  if (Math.abs(value) < 1e-10) return 1;
  const angle = Math.PI * value;
  return Math.sin(angle) / angle;
}

function aliasFrequency(frequency, sampleRate) {
  return Math.abs(((frequency + sampleRate / 2) % sampleRate) - sampleRate / 2);
}

function createChartMarkup({ curves, samples = [], yRange, yTicks }) {
  const x = (time) =>
    margins.left + ((time - timeRange[0]) / (timeRange[1] - timeRange[0])) *
      (plotWidth - margins.left - margins.right);
  const y = (value) =>
    margins.top + ((yRange[1] - value) / (yRange[1] - yRange[0])) *
      (plotHeight - margins.top - margins.bottom);
  const parts = [];
  const xTicks = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5];

  for (const tick of xTicks) {
    parts.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${margins.top}" x2="${x(tick)}" y2="${plotHeight - margins.bottom}" />
      <text class="plot-tick-label" x="${x(tick)}" y="${plotHeight - 14}" text-anchor="middle">${formatNumber(tick, 1)}</text>
    `);
  }
  for (const tick of yTicks) {
    parts.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${margins.left}" y1="${y(tick)}" x2="${plotWidth - margins.right}" y2="${y(tick)}" />
      <text class="plot-tick-label" x="${margins.left - 10}" y="${y(tick) + 4}" text-anchor="end">${formatNumber(tick)}</text>
    `);
  }

  for (const curve of curves) {
    const points = [];
    for (let index = 0; index < sampleCount; index += 1) {
      const time = timeRange[0] +
        ((timeRange[1] - timeRange[0]) * index) / (sampleCount - 1);
      points.push([x(time), y(curve.value(time))]);
    }
    const path = points
      .map(([pointX, pointY], index) =>
        `${index === 0 ? "M" : "L"}${pointX.toFixed(2)},${pointY.toFixed(2)}`,
      )
      .join(" ");
    parts.push(
      `<path d="${path}" fill="none" stroke="${curve.color}" stroke-width="${curve.width ?? 3}" ${curve.dash ? `stroke-dasharray="${curve.dash}"` : ""} stroke-linecap="round" stroke-linejoin="round" />`,
    );
  }

  for (const sample of samples) {
    if (sample.time < timeRange[0] || sample.time > timeRange[1]) continue;
    parts.push(`
      <line x1="${x(sample.time)}" y1="${y(0)}" x2="${x(sample.time)}" y2="${y(sample.value)}" stroke="#d97706" stroke-width="2" />
      <circle cx="${x(sample.time)}" cy="${y(sample.value)}" r="5" fill="#d97706" stroke="#ffffff" stroke-width="2" />
    `);
  }

  parts.push(`
    <text class="plot-axis-label" x="${plotWidth - margins.right}" y="${plotHeight - 3}" text-anchor="end">t (s)</text>
    <text class="plot-axis-label" x="14" y="${margins.top}">amplitud</text>
  `);
  return parts.join("");
}

function render() {
  const bounds = sampledPlot.getBoundingClientRect();
  plotWidth = bounds.height > 0 ? Math.max(320, plotHeight * bounds.width / bounds.height) : 800;
  sampledPlot.setAttribute("viewBox", `0 0 ${plotWidth} ${plotHeight}`);
  const selectedSignal = signalDefinitions[signalSelect.value];
  const baseFrequency = Number(signalFrequency.value);
  const sampleRate = Number(samplingFrequency.value);
  const frequencies = selectedSignal.frequencies(baseFrequency);
  const highestFrequency = Math.max(...frequencies);
  const analogSignal = (time) => selectedSignal.value(time, baseFrequency);
  const signalPeak = signalSelect.value === "two-tone" ? 1.5 : 1;
  const sampleIndexStart =
    Math.floor(timeRange[0] * sampleRate) - sincGuardSamples;
  const sampleIndexEnd =
    Math.ceil(timeRange[1] * sampleRate) + sincGuardSamples;
  const samples = [];

  for (let index = sampleIndexStart; index <= sampleIndexEnd; index += 1) {
    const time = index / sampleRate;
    samples.push({ time, value: analogSignal(time) });
  }

  const reconstructedSignal = (time) =>
    samples.reduce(
      (total, sample) =>
        total + sample.value * sinc(sampleRate * (time - sample.time)),
      0,
    );
  const reconstructedValues = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const time = timeRange[0] +
      ((timeRange[1] - timeRange[0]) * index) / (sampleCount - 1);
    reconstructedValues.push(reconstructedSignal(time));
  }

  const yMagnitude = Math.max(
    signalPeak,
    ...reconstructedValues.map(Math.abs),
  );
  const yLimit = Math.ceil(yMagnitude * 1.2 * 2) / 2;
  const yRange = [-yLimit, yLimit];
  const yTicks = [-yLimit, 0, yLimit];
  const nyquistRate = 2 * highestFrequency;
  const atNyquistLimit = Math.abs(sampleRate - nyquistRate) < 1e-9;
  const meetsNyquist = sampleRate > nyquistRate;
  const aliasFrequencies = frequencies.map((frequency) =>
    aliasFrequency(frequency, sampleRate),
  );

  signalFrequencyOutput.value = `${formatNumber(baseFrequency)} Hz`;
  signalFrequencyOutput.textContent = `${formatNumber(baseFrequency)} Hz`;
  samplingFrequencyOutput.value = `${formatNumber(sampleRate)} Hz`;
  samplingFrequencyOutput.textContent = `${formatNumber(sampleRate)} Hz`;
  document.querySelector("#sampling-period").textContent =
    `Tₛ = ${formatNumber(1 / sampleRate)} s`;
  const statusPanel = document.querySelector("#sampling-status");
  const bandlimited = selectedSignal.bandlimited;
  const samplingIsSafe = bandlimited && meetsNyquist;
  statusPanel.classList.toggle("is-nyquist-safe", samplingIsSafe);
  statusPanel.classList.toggle("is-aliasing", !samplingIsSafe);
  document.querySelector("#sampling-status-title").textContent = !bandlimited
    ? `Señal no limitada en banda: sus armónicos superan fₛ/2 = ${formatNumber(sampleRate / 2)} Hz`
    : meetsNyquist
      ? `Muestreo suficiente: fₛ = ${formatNumber(sampleRate)} Hz > 2 fₘáx = ${formatNumber(nyquistRate)} Hz`
      : atNyquistLimit
        ? `Límite de Nyquist: fₛ = 2 fₘáx = ${formatNumber(nyquistRate)} Hz`
        : `Posible aliasing: fₛ = ${formatNumber(sampleRate)} Hz < 2 fₘáx = ${formatNumber(nyquistRate)} Hz`;
  document.querySelector("#sampling-status-detail").textContent = !bandlimited
    ? `La fundamental de ${formatNumber(baseFrequency)} Hz aparece a ${formatNumber(aliasFrequency(baseFrequency, sampleRate))} Hz. ${signalSelect.value === "square" ? "La rectangular de duty 50 % contiene armónicos impares." : "La triangular contiene armónicos impares que decrecen en amplitud."}`
    : `Frecuencia${aliasFrequencies.length > 1 ? "s" : ""} aparente${aliasFrequencies.length > 1 ? "s" : ""} tras el muestreo: ${aliasFrequencies.map((frequency) => `${formatNumber(frequency)} Hz`).join(" y ")}.`;
  document.querySelector("#reconstruction-description").textContent = !bandlimited
    ? "La interpolación sinc reconstruye la versión limitada a banda compatible con las muestras, no la onda ideal original. Los armónicos por encima de Nyquist producen aliasing."
    : meetsNyquist
      ? "Con la frecuencia de muestreo seleccionada, la reconstrucción ideal recupera la señal original (salvo el pequeño efecto de truncar la suma sinc)."
      : atNyquistLimit
        ? "En el límite exacto de Nyquist, algunas fases pueden ser indistinguibles; una frecuencia de muestreo mayor evita esta ambigüedad."
        : "Al no cumplirse Nyquist, las muestras también son compatibles con frecuencias más bajas: la reconstrucción puede parecer una señal distinta.";

  sampledPlot.innerHTML = createChartMarkup({
    curves: [
      { value: analogSignal, color: "#164b8c" },
      { value: reconstructedSignal, color: "#15803d", dash: "8 5" },
    ],
    samples,
    yRange,
    yTicks,
  });
  sampledPlot.setAttribute(
    "aria-label",
    `${selectedSignal.name} de ${formatNumber(baseFrequency)} Hz con muestras a ${formatNumber(sampleRate)} Hz`,
  );

}

signalSelect.addEventListener("change", render);
signalFrequency.addEventListener("input", render);
samplingFrequency.addEventListener("input", render);

render();

let samplingPlotSize = "";
new ResizeObserver(() => {
  const bounds = sampledPlot.getBoundingClientRect();
  const size = `${bounds.width.toFixed(1)}:${bounds.height.toFixed(1)}`;
  if (size === samplingPlotSize) return;
  samplingPlotSize = size;
  render();
}).observe(sampledPlot);
