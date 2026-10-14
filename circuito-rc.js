const limits = {
  resistance: { min: 0.01, max: 1000, label: "R", unit: "kΩ" },
  capacitance: { min: 0.01, max: 1000, label: "C", unit: "µF" },
  amplitude: { min: 0.1, max: 50, label: "La amplitud A", unit: "V" },
  period: { min: 0.01, max: 100000, label: "El periodo T", unit: "ms" },
  duty: { min: 1, max: 99, label: "El ciclo de trabajo", unit: "%" },
};

const colors = { input: "var(--answer)", output: "#d97706" };
const gridSamples = 800;

const circuitSelect = document.querySelector("#rc-circuit");
const inputSelect = document.querySelector("#rc-input");
const fields = {
  resistance: document.querySelector("#rc-resistance"),
  capacitance: document.querySelector("#rc-capacitance"),
  amplitude: document.querySelector("#rc-amplitude"),
  period: document.querySelector("#rc-period"),
  duty: document.querySelector("#rc-duty"),
};
const periodUnit = document.querySelector("#rc-period-unit");
const unitFactor = { ms: 1, us: 0.001 };
const unitName = { ms: "ms", us: "µs" };
const squareFields = document.querySelectorAll("[data-square-field]");
const errorMessage = document.querySelector("#rc-error");
const schematic = document.querySelector("#rc-schematic");
const equations = document.querySelector("#rc-equations");
const inputPlot = document.querySelector("#rc-input-plot");
const outputPlot = document.querySelector("#rc-output-plot");
const inputBadge = document.querySelector("#rc-input-badge");
const outputBadge = document.querySelector("#rc-output-badge");
const readouts = document.querySelector("#rc-readouts");
let displayedCircuit = null;

const numberFormat = new Intl.NumberFormat("es", {
  maximumSignificantDigits: 3,
  useGrouping: false,
});

function formatNumber(value) {
  return numberFormat.format(Math.abs(value) < 1e-9 ? 0 : value).replace("-", "−");
}

function formatTime(ms) {
  return ms < 1 ? `${formatNumber(ms * 1000)} µs` : `${formatNumber(ms)} ms`;
}

function readParameters() {
  const isSquare = inputSelect.value === "square";
  const names = ["resistance", "capacitance", "amplitude"];
  if (isSquare) names.push("period", "duty");
  const values = {};
  for (const name of names) {
    const { min, max, label, unit } = limits[name];
    const raw = fields[name].value.trim();
    const value = Number(raw);
    const factor = name === "period" ? unitFactor[periodUnit.value] : 1;
    const shownUnit = name === "period" ? unitName[periodUnit.value] : unit;
    if (raw === "" || !Number.isFinite(value)) {
      return { error: `${label} debe ser un número. Escribe un valor entre ${formatNumber(min / factor)} y ${formatNumber(max / factor)} ${shownUnit}.` };
    }
    if (value * factor < min * (1 - 1e-9) || value * factor > max * (1 + 1e-9)) {
      return { error: `${label} debe estar entre ${formatNumber(min / factor)} y ${formatNumber(max / factor)} ${shownUnit}.` };
    }
    values[name] = value * factor;
  }
  return {
    mode: circuitSelect.value,
    isSquare,
    ...values,
    tau: values.resistance * values.capacitance,
  };
}

function niceTicks(min, max, target = 7) {
  const rawStep = (max - min) / target;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step = (normalized < 1.5 ? 1 : normalized < 3.5 ? 2 : normalized < 7.5 ? 5 : 10) * magnitude;
  const ticks = [];
  for (let index = Math.ceil(min / step - 1e-9); index * step <= max + step * 1e-9; index += 1) {
    ticks.push(Number((index * step).toPrecision(12)));
  }
  return ticks;
}

function buildSegments(params, tMin, tMax) {
  const segments = [{ t0: tMin, t1: 0, x: 0 }];
  if (!params.isSquare) {
    segments.push({ t0: 0, t1: tMax, x: params.amplitude });
    return segments;
  }
  const onTime = (params.period * params.duty) / 100;
  for (let cycle = 0; cycle * params.period < tMax; cycle += 1) {
    const start = cycle * params.period;
    const fall = Math.min(start + onTime, tMax);
    segments.push({ t0: start, t1: fall, x: params.amplitude });
    const nextRise = Math.min(start + params.period, tMax);
    if (fall < nextRise) segments.push({ t0: fall, t1: nextRise, x: 0 });
  }
  return segments;
}

// Dentro de cada tramo x es constante, así que la salida del RC es exacta:
// v_C(t) = x + (v_C(t0) − x)·e^(−(t − t0)/τ). El CR es y = x − v_C.
function solve(params, tMin, tMax) {
  const segments = buildSegments(params, tMin, tMax);
  const step = (tMax - tMin) / (gridSamples - 1);
  const refinement = [0.1, 0.25, 0.5, 1, 1.5, 2, 3, 5];
  const inputPoints = [];
  const outputPoints = [];
  let capacitorStart = 0;

  for (const segment of segments) {
    const times = [segment.t0, segment.t1];
    const first = Math.ceil((segment.t0 - tMin) / step);
    for (let index = first; tMin + index * step < segment.t1; index += 1) {
      const time = tMin + index * step;
      if (time > segment.t0) times.push(time);
    }
    for (const multiple of refinement) {
      const time = segment.t0 + multiple * params.tau;
      if (time > segment.t0 && time < segment.t1) times.push(time);
    }
    times.sort((a, b) => a - b);

    inputPoints.push([segment.t0, segment.x], [segment.t1, segment.x]);
    for (const time of times) {
      const capacitor =
        segment.x + (capacitorStart - segment.x) * Math.exp(-(time - segment.t0) / params.tau);
      outputPoints.push([time, params.mode === "rc" ? capacitor : segment.x - capacitor]);
    }
    capacitorStart =
      segment.x + (capacitorStart - segment.x) * Math.exp(-(segment.t1 - segment.t0) / params.tau);
  }
  return { inputPoints, outputPoints };
}

function chartMarkup({ series, xRange, yRange, xLabel, yLabel, marker = null }) {
  const width = 800;
  const height = 300;
  const margin = { top: 22, right: 24, bottom: 42, left: 62 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = (value) => margin.left + ((value - xRange[0]) / (xRange[1] - xRange[0])) * plotWidth;
  const y = (value) => margin.top + ((yRange[1] - value) / (yRange[1] - yRange[0])) * plotHeight;
  const parts = [];

  for (const tick of niceTicks(xRange[0], xRange[1])) {
    parts.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height - margin.bottom}" />
      <text class="plot-tick-label" x="${x(tick)}" y="${height - 15}" text-anchor="middle">${formatNumber(tick)}</text>
    `);
  }
  for (const tick of niceTicks(yRange[0], yRange[1], 5)) {
    parts.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}" />
      <text class="plot-tick-label" x="${margin.left - 10}" y="${y(tick) + 4}" text-anchor="end">${formatNumber(tick)}</text>
    `);
  }

  for (const curve of series) {
    const path = curve.points
      .map(([time, value], index) => `${index === 0 ? "M" : "L"}${x(time).toFixed(2)},${y(value).toFixed(2)}`)
      .join(" ");
    const dash = curve.dashed ? ' stroke-dasharray="8 6"' : "";
    parts.push(`<path d="${path}" fill="none" stroke="${curve.color}" stroke-width="${curve.width}"${dash} stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />`);
  }

  if (marker && marker.time >= xRange[0] && marker.time <= xRange[1]) {
    parts.push(`
      <line x1="${x(marker.time)}" y1="${margin.top}" x2="${x(marker.time)}" y2="${height - margin.bottom}" stroke="var(--muted)" stroke-width="2" stroke-dasharray="3 5" />
      <text class="plot-annotation" x="${x(marker.time) + 6}" y="${margin.top + 12}">${marker.label}</text>
    `);
  }

  parts.push(`
    <text class="plot-axis-label" x="${width - margin.right}" y="${height - 3}" text-anchor="end">${xLabel}</text>
    <text class="plot-axis-label" x="14" y="${margin.top}" text-anchor="start">${yLabel}</text>
  `);
  return parts.join("");
}

function schematicMarkup(mode) {
  const resistor = (x0, x1, y) =>
    `<rect x="${x0}" y="${y - 9}" width="${x1 - x0}" height="18" rx="2" />`;
  const resistorV = (x, y0, y1) =>
    `<rect x="${x - 9}" y="${y0}" width="18" height="${y1 - y0}" rx="2" />`;
  const capacitor = (x, y) =>
    `<line x1="${x - 4}" y1="${y - 14}" x2="${x - 4}" y2="${y + 14}" /><line x1="${x + 4}" y1="${y - 14}" x2="${x + 4}" y2="${y + 14}" />`;
  const capacitorV = (x, y) =>
    `<line x1="${x - 14}" y1="${y - 4}" x2="${x + 14}" y2="${y - 4}" /><line x1="${x - 14}" y1="${y + 4}" x2="${x + 14}" y2="${y + 4}" />`;

  if (mode === "rc") {
    return `
      <g class="rc-wire">
        <line x1="26" y1="40" x2="100" y2="40" />${resistor(100, 160, 40)}
        <line x1="160" y1="40" x2="300" y2="40" />
        <line x1="230" y1="40" x2="230" y2="66" />${capacitorV(230, 75)}
        <line x1="230" y1="84" x2="230" y2="120" />
        <line x1="26" y1="120" x2="300" y2="120" />
      </g>
      <circle class="rc-terminal" cx="26" cy="40" r="4" /><circle class="rc-terminal" cx="26" cy="120" r="4" />
      <circle class="rc-terminal" cx="300" cy="40" r="4" /><circle class="rc-terminal" cx="300" cy="120" r="4" />
      <text x="40" y="82">x(t)</text><text x="130" y="26" text-anchor="middle">R</text>
      <text x="252" y="80">C</text><text x="314" y="82">y(t)</text>`;
  }
  return `
    <g class="rc-wire">
      <line x1="26" y1="40" x2="100" y2="40" />${capacitor(108, 40)}
      <line x1="116" y1="40" x2="300" y2="40" />
      <line x1="230" y1="40" x2="230" y2="56" />${resistorV(230, 56, 104)}
      <line x1="230" y1="104" x2="230" y2="120" />
      <line x1="26" y1="120" x2="300" y2="120" />
    </g>
    <circle class="rc-terminal" cx="26" cy="40" r="4" /><circle class="rc-terminal" cx="26" cy="120" r="4" />
    <circle class="rc-terminal" cx="300" cy="40" r="4" /><circle class="rc-terminal" cx="300" cy="120" r="4" />
    <text x="40" y="82">x(t)</text><text x="108" y="20" text-anchor="middle">C</text>
    <text x="252" y="84">R</text><text x="314" y="82">y(t)</text>`;
}

const equationText = {
  rc: [
    "\\(\\tau=RC,\\qquad f_c=\\dfrac{1}{2\\pi RC}\\)",
    "\\(\\tau\\,\\dfrac{\\mathrm{d}y}{\\mathrm{d}t}+y(t)=x(t)\\)",
    "\\(H(s)=\\dfrac{1}{1+s\\tau},\\qquad h(t)=\\dfrac{1}{\\tau}\\,e^{-t/\\tau}u(t)\\)",
    "\\(\\text{Escalón: }y(t)=A\\left(1-e^{-t/\\tau}\\right)u(t)\\)",
  ],
  cr: [
    "\\(\\tau=RC,\\qquad f_c=\\dfrac{1}{2\\pi RC}\\)",
    "\\(\\tau\\,\\dfrac{\\mathrm{d}y}{\\mathrm{d}t}+y(t)=\\tau\\,\\dfrac{\\mathrm{d}x}{\\mathrm{d}t}\\)",
    "\\(H(s)=\\dfrac{s\\tau}{1+s\\tau},\\qquad h(t)=\\delta(t)-\\dfrac{1}{\\tau}\\,e^{-t/\\tau}u(t)\\)",
    "\\(\\text{Escalón: }y(t)=A\\,e^{-t/\\tau}u(t)\\)",
  ],
};

function showCircuit(mode) {
  if (displayedCircuit === mode) return;
  displayedCircuit = mode;
  schematic.innerHTML = schematicMarkup(mode);
  schematic.setAttribute(
    "aria-label",
    mode === "rc"
      ? "Esquema de un circuito RC: resistencia en serie, condensador en paralelo y salida en el condensador"
      : "Esquema de un circuito CR: condensador en serie, resistencia en paralelo y salida en la resistencia",
  );
  const mathjax = window.MathJax;
  if (mathjax && mathjax.typesetClear) mathjax.typesetClear([equations]);
  equations.innerHTML = equationText[mode].map((text) => `<p>${text}</p>`).join("");
  if (mathjax && mathjax.typesetPromise) mathjax.typesetPromise([equations]);
}

function readoutRow(term, value) {
  return `<div><dt>${term}</dt><dd>${value}</dd></div>`;
}

function render() {
  const isSquare = inputSelect.value === "square";
  for (const field of squareFields) field.hidden = !isSquare;
  showCircuit(circuitSelect.value);

  const params = readParameters();
  if (params.error) {
    errorMessage.textContent = `⚠ ${params.error}`;
    errorMessage.hidden = false;
    return;
  }
  errorMessage.hidden = true;
  errorMessage.textContent = "";

  const span = params.isSquare
    ? Math.min(Math.max(5 * params.tau, 4 * params.period), 30 * params.period)
    : 6 * params.tau;
  const tMin = -span / 10;
  const tMax = span;
  const { inputPoints, outputPoints } = solve(params, tMin, tMax);

  const values = [...inputPoints, ...outputPoints].map(([, value]) => value);
  const dataMin = Math.min(0, ...values);
  const dataMax = Math.max(0, ...values);
  const padding = (dataMax - dataMin) * 0.12;
  const yRange = [dataMin === 0 ? 0 - padding * 0.4 : dataMin - padding, dataMax + padding];

  const timeUnit = params.isSquare ? periodUnit.value : span < 1 ? "us" : "ms";
  const toPlot = (points) => points.map(([time, value]) => [time / unitFactor[timeUnit], value]);
  const xRange = [tMin / unitFactor[timeUnit], tMax / unitFactor[timeUnit]];
  const timeLabel = `t (${unitName[timeUnit]})`;

  inputPlot.innerHTML = chartMarkup({
    series: [{ points: toPlot(inputPoints), color: colors.input, width: 3 }],
    xRange,
    yRange,
    xLabel: timeLabel,
    yLabel: "x(t) (V)",
  });
  outputPlot.innerHTML = chartMarkup({
    series: [
      { points: toPlot(inputPoints), color: colors.input, width: 2, dashed: true },
      { points: toPlot(outputPoints), color: colors.output, width: 3 },
    ],
    xRange,
    yRange,
    xLabel: timeLabel,
    yLabel: "y(t) (V)",
    marker: { time: params.tau / unitFactor[timeUnit], label: "t = τ" },
  });

  const circuitName = params.mode === "rc" ? "RC, salida en el condensador" : "CR, salida en la resistencia";
  const inputName = params.isSquare
    ? `señal cuadrada de periodo ${formatTime(params.period)} y ciclo de trabajo ${formatNumber(params.duty)} %`
    : "escalón unitario";
  inputPlot.setAttribute("aria-label", `Entrada x de t: ${inputName}, amplitud ${formatNumber(params.amplitude)} voltios`);
  outputPlot.setAttribute("aria-label", `Salida y de t del circuito ${circuitName} para la entrada ${inputName}`);
  inputBadge.textContent = params.isSquare
    ? `Cuadrada · T = ${formatTime(params.period)} · ${formatNumber(params.duty)} %`
    : "Escalón unitario";
  outputBadge.textContent = `τ = ${formatTime(params.tau)}`;

  const outputValues = outputPoints.map(([, value]) => value);
  const cutoff = 1000 / (2 * Math.PI * params.tau);
  const rows = [
    readoutRow("Constante de tiempo τ = R·C", formatTime(params.tau)),
    readoutRow("Frecuencia de corte f<sub>c</sub>", `${formatNumber(cutoff)} Hz`),
  ];
  if (params.isSquare) {
    rows.push(readoutRow("Frecuencia de la entrada f<sub>0</sub>", `${formatNumber(1000 / params.period)} Hz`));
  } else {
    const atTau = params.mode === "rc" ? 1 - Math.exp(-1) : Math.exp(-1);
    rows.push(readoutRow("Salida en t = τ", `${formatNumber(atTau * params.amplitude)} V (${formatNumber(atTau * 100)} % de A)`));
  }
  rows.push(
    readoutRow("Máximo de y(t)", `${formatNumber(Math.max(...outputValues))} V`),
    readoutRow("Mínimo de y(t)", `${formatNumber(Math.min(...outputValues))} V`),
  );
  readouts.innerHTML = rows.join("");
}

document.querySelector("#rc-form").addEventListener("submit", (event) => event.preventDefault());
circuitSelect.addEventListener("change", render);
inputSelect.addEventListener("change", render);
periodUnit.addEventListener("change", render);
for (const field of Object.values(fields)) field.addEventListener("input", render);

render();
