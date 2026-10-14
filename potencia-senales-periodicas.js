const signals = [
  {
    id: "square-half",
    title: "Señal cuadrada x₁(t)",
    value: (phase) => (phase < 0.5 ? 5 : 1),
    mean: 3,
    meanSquare: 13,
    acRms: 2,
  },
  {
    id: "square-quarter",
    title: "Señal rectangular x₂(t)",
    value: (phase) => (phase < 0.25 ? 5 : 1),
    mean: 2,
    meanSquare: 7,
    acRms: Math.sqrt(3),
  },
  {
    id: "triangle",
    title: "Señal triangular x₃(t)",
    value: (phase) => (phase < 0.5 ? 1 + 8 * phase : 5 - 8 * (phase - 0.5)),
    mean: 3,
    meanSquare: 31 / 3,
    acRms: 2 / Math.sqrt(3),
  },
  {
    id: "cosine",
    title: "Señal sinusoidal x₄(t)",
    value: (phase) => 3 + 2 * Math.cos(2 * Math.PI * phase),
    mean: 3,
    meanSquare: 11,
    acRms: Math.sqrt(2),
  },
  {
    id: "asymmetric-ramp",
    title: "Señal periódica por tramos x₅(t)",
    period: 3,
    value: (phase) => {
      const time = phase * 3;
      if (time < 1) return 2 - time;
      if (time < 2) return -1;
      return time - 2;
    },
    mean: 1 / 3,
    meanSquare: 11 / 9,
    acRms: Math.sqrt(10) / 3,
  },
];

const pickerNames = [
  "Cuadrada · 50 %",
  "Rectangular · 25 %",
  "Triangular",
  "Sinusoidal",
  "Por tramos · T = 3 ms",
];
const picker = document.querySelector("#power-signal-picker");
const plot = document.querySelector("#power-plot");
const resistanceInput = document.querySelector("#load-resistance");
let selectedSignal = signals[0];

function formatNumber(value) {
  return Number(value.toFixed(3)).toString();
}

function renderPicker() {
  picker.innerHTML = signals
    .map(
      (signal, index) => `
        <button class="power-signal-option" type="button" data-signal="${signal.id}" aria-pressed="${signal.id === selectedSignal.id}">
          <span>x${["₁", "₂", "₃", "₄", "₅"][index]}(t)</span>
        <small>${pickerNames[index]}</small>
        </button>
      `,
    )
    .join("");
}

function plotSignal() {
  const width = 800;
  const height = 360;
  const margin = { top: 30, right: 24, bottom: 46, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const period = selectedSignal.period ?? 1;
  const duration = 4 * period;
  const isAsymmetricRamp = selectedSignal.id === "asymmetric-ramp";
  const yMin = isAsymmetricRamp ? -1 : 0;
  const yMax = isAsymmetricRamp ? 2 : 6;
  const x = (time) => margin.left + (time / duration) * plotWidth;
  const y = (value) =>
    margin.top + ((yMax - value) / (yMax - yMin)) * plotHeight;
  const pieces = [];

  for (let tick = 0; tick <= duration; tick += 1) {
    pieces.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height - margin.bottom}" />
      <text class="plot-tick-label" x="${x(tick)}" y="${height - 15}" text-anchor="middle">${tick}</text>
    `);
  }
  const yTicks = isAsymmetricRamp ? [-1, 0, 1, 2] : [0, 1, 2, 3, 4, 5, 6];
  yTicks.forEach((tick) => {
    pieces.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}" />
      <text class="plot-tick-label" x="${margin.left - 12}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>
    `);
  });

  let path;
  if (isAsymmetricRamp) {
    path = Array.from({ length: 4 }, (_, index) => {
      const start = index * period;
      return [
        `${index === 0 ? "M" : "L"}${x(start).toFixed(2)},${y(2).toFixed(2)}`,
        `L${x(start + 1).toFixed(2)},${y(1).toFixed(2)}`,
        `L${x(start + 1).toFixed(2)},${y(-1).toFixed(2)}`,
        `L${x(start + 2).toFixed(2)},${y(-1).toFixed(2)}`,
        `L${x(start + 2).toFixed(2)},${y(0).toFixed(2)}`,
        `L${x(start + 3).toFixed(2)},${y(1).toFixed(2)}`,
        `L${x(start + 3).toFixed(2)},${y(2).toFixed(2)}`,
      ].join(" ");
    }).join(" ");
  } else {
    const count = 1600;
    const points = [];
    for (let index = 0; index <= count; index += 1) {
      const time = (duration * index) / count;
      const phase = (time / period) % 1;
      const value = selectedSignal.value(phase);
      points.push(`${index === 0 ? "M" : "L"}${x(time).toFixed(2)},${y(value).toFixed(2)}`);
    }
    path = points.join(" ");
  }
  pieces.push(`
    <path d="${path}" fill="none" stroke="#164b8c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    <text class="plot-axis-label" x="${width - margin.right}" y="${height - 3}" text-anchor="end">Tiempo (ms)</text>
    <text class="plot-axis-label" x="14" y="${margin.top}" text-anchor="start">Amplitud (V)</text>
  `);
  plot.innerHTML = pieces.join("");
  plot.setAttribute("aria-label", `Gráfica temporal de ${selectedSignal.title}, cuatro periodos de ${period} milisegundos`);
}

function renderResults() {
  const resistance = Number(resistanceInput.value);
  const resistanceIsValid =
    Number.isFinite(resistance) && resistance >= 0.1 && resistance <= 1000;
  resistanceInput.setAttribute("aria-invalid", String(!resistanceIsValid));
  document.querySelector("#signal-title").textContent = selectedSignal.title;
  document.querySelector("#power-period").textContent =
    `T = ${selectedSignal.period ?? 1} ms`;
  document.querySelectorAll("[data-signal-equation]").forEach((equation) => {
    equation.hidden = equation.dataset.signalEquation !== selectedSignal.id;
  });
  document.querySelectorAll("[data-power-explanation]").forEach((explanation) => {
    explanation.hidden = explanation.dataset.powerExplanation !== selectedSignal.id;
  });
  document.querySelector("#power-input-error").hidden = resistanceIsValid;
  document.querySelector("#mean-value").textContent = formatNumber(selectedSignal.mean);
  document.querySelector("#rms-value").textContent = formatNumber(Math.sqrt(selectedSignal.meanSquare));
  document.querySelector("#ac-rms-value").textContent = formatNumber(selectedSignal.acRms);
  document.querySelector("#power-value").textContent = resistanceIsValid
    ? formatNumber(selectedSignal.meanSquare / resistance)
    : "—";
  renderPicker();
  plotSignal();
}

picker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-signal]");
  if (!button) return;
  selectedSignal = signals.find((signal) => signal.id === button.dataset.signal);
  renderResults();
});
resistanceInput.addEventListener("input", renderResults);

renderResults();
