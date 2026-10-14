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
          <span>x${["₁", "₂", "₃", "₄"][index]}(t)</span>
          <small>${["Cuadrada · 50 %", "Rectangular · 25 %", "Triangular", "Sinusoidal"][index]}</small>
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
  const x = (time) => margin.left + (time / 4) * plotWidth;
  const y = (value) => margin.top + ((6 - value) / 6) * plotHeight;
  const pieces = [];

  for (let tick = 0; tick <= 4; tick += 1) {
    pieces.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height - margin.bottom}" />
      <text class="plot-tick-label" x="${x(tick)}" y="${height - 15}" text-anchor="middle">${tick}</text>
    `);
  }
  for (let tick = 0; tick <= 6; tick += 1) {
    pieces.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}" />
      <text class="plot-tick-label" x="${margin.left - 12}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>
    `);
  }

  const count = 1600;
  const points = [];
  for (let index = 0; index <= count; index += 1) {
    const time = (4 * index) / count;
    const phase = time % 1;
    const value = selectedSignal.value(phase);
    points.push(`${index === 0 ? "M" : "L"}${x(time).toFixed(2)},${y(value).toFixed(2)}`);
  }
  pieces.push(`
    <path d="${points.join(" ")}" fill="none" stroke="#164b8c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    <text class="plot-axis-label" x="${width - margin.right}" y="${height - 3}" text-anchor="end">Tiempo (ms)</text>
    <text class="plot-axis-label" x="14" y="${margin.top}" text-anchor="start">Amplitud (V)</text>
  `);
  plot.innerHTML = pieces.join("");
  plot.setAttribute("aria-label", `Gráfica temporal de ${selectedSignal.title}, cuatro periodos`);
}

function renderResults() {
  const resistance = Number(resistanceInput.value);
  const resistanceIsValid =
    Number.isFinite(resistance) && resistance >= 0.1 && resistance <= 1000;
  resistanceInput.setAttribute("aria-invalid", String(!resistanceIsValid));
  document.querySelector("#signal-title").textContent = selectedSignal.title;
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
