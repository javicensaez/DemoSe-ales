const limits = {
  resistance: { min: 0.01, max: 10000, label: "R", unit: "Ω" },
  inductance: { min: 0.01, max: 1000, label: "L", unit: "mH" },
  capacitance: { min: 0.01, max: 1000, label: "C", unit: "µF" },
  amplitude: { min: 0.1, max: 50, label: "La amplitud A", unit: "V" },
};

const fields = {
  resistance: document.querySelector("#rlc-resistance"),
  inductance: document.querySelector("#rlc-inductance"),
  capacitance: document.querySelector("#rlc-capacitance"),
  amplitude: document.querySelector("#rlc-amplitude"),
};
const errorMessage = document.querySelector("#rlc-error");
const stepPlot = document.querySelector("#rlc-step-plot");
const polePlot = document.querySelector("#rlc-polezero-plot");
const poleNote = document.querySelector("#rlc-polezero-note");
const dampingBadge = document.querySelector("#rlc-damping-badge");
const stabilityBadge = document.querySelector("#rlc-stability-badge");
const readouts = document.querySelector("#rlc-readouts");
const identifyValues = document.querySelector("#rlc-identify-values");
const identifyNote = document.querySelector("#rlc-identify-note");

const numberFormat = new Intl.NumberFormat("es", {
  maximumSignificantDigits: 3,
  useGrouping: false,
});
const colors = { input: "var(--answer)", output: "#d97706" };

function formatNumber(value) {
  return numberFormat.format(Math.abs(value) < 1e-12 ? 0 : value).replace("-", "−");
}

function formatSeconds(seconds) {
  if (seconds < 1e-3) return `${formatNumber(seconds * 1e6)} µs`;
  if (seconds < 1) return `${formatNumber(seconds * 1e3)} ms`;
  return `${formatNumber(seconds)} s`;
}

function formatComplex(real, imag) {
  if (imag === 0) return formatNumber(real);
  return `${formatNumber(real)} ${imag > 0 ? "+" : "−"} j${formatNumber(Math.abs(imag))}`;
}

function readParameters() {
  const values = {};
  for (const [name, { min, max, label, unit }] of Object.entries(limits)) {
    const raw = fields[name].value.trim();
    const value = Number(raw);
    if (raw === "" || !Number.isFinite(value)) {
      return { error: `${label} debe ser un número. Escribe un valor entre ${formatNumber(min)} y ${formatNumber(max)} ${unit}.` };
    }
    if (value < min || value > max) {
      return { error: `${label} debe estar entre ${formatNumber(min)} y ${formatNumber(max)} ${unit}.` };
    }
    values[name] = value;
  }
  return values;
}

// Con R en Ω, L en mH y C en µF: α = R/(2L), ω0 = 1/√(LC) (SI).
function analyze({ resistance, inductance, capacitance, amplitude }) {
  const L = inductance * 1e-3;
  const C = capacitance * 1e-6;
  const alpha = resistance / (2 * L);
  const omega0 = 1 / Math.sqrt(L * C);
  const zeta = alpha / omega0;
  const discriminant = alpha * alpha - omega0 * omega0;
  const tolerance = 1e-9 * omega0 * omega0;
  let kind;
  let poles;
  if (Math.abs(discriminant) <= tolerance) {
    kind = "critical";
    poles = [{ re: -alpha, im: 0 }, { re: -alpha, im: 0 }];
  } else if (discriminant < 0) {
    kind = "under";
    const wd = Math.sqrt(-discriminant);
    poles = [{ re: -alpha, im: wd }, { re: -alpha, im: -wd }];
  } else {
    kind = "over";
    const beta = Math.sqrt(discriminant);
    poles = [{ re: -alpha + beta, im: 0 }, { re: -alpha - beta, im: 0 }];
  }
  return { alpha, omega0, zeta, kind, poles, amplitude };
}

function stepValue(model, time) {
  if (time <= 0) return 0;
  const { alpha, kind, poles, amplitude } = model;
  if (kind === "under") {
    const wd = poles[0].im;
    return amplitude * (1 - Math.exp(-alpha * time) * (Math.cos(wd * time) + (alpha / wd) * Math.sin(wd * time)));
  }
  if (kind === "critical") {
    return amplitude * (1 - (1 + alpha * time) * Math.exp(-alpha * time));
  }
  const p1 = poles[0].re;
  const p2 = poles[1].re;
  return amplitude * (1 + (p2 * Math.exp(p1 * time) - p1 * Math.exp(p2 * time)) / (p1 - p2));
}

function niceTicks(min, max, target = 6) {
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

function stepChart({ series, xRange, yRange, xLabel, yLabel, markers = [] }) {
  const width = 800;
  const height = 480;
  const margin = { top: 22, right: 24, bottom: 42, left: 62 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = (value) => margin.left + ((value - xRange[0]) / (xRange[1] - xRange[0])) * plotWidth;
  const y = (value) => margin.top + ((yRange[1] - value) / (yRange[1] - yRange[0])) * plotHeight;
  const parts = [];

  for (const tick of niceTicks(xRange[0], xRange[1], 7)) {
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
  if (markers.length) {
    for (const marker of markers) {
      const px = x(marker.x);
      const py = y(marker.y);
      const anchor = px > width - margin.right - 220 ? "end" : "start";
      const dx = anchor === "end" ? -14 : 14;
      parts.push(`
        <line class="rlc-peak-guide" x1="${px}" y1="${py}" x2="${px}" y2="${y(0)}" />
        <line class="rlc-peak-guide" x1="${margin.left}" y1="${py}" x2="${px}" y2="${py}" />
        <circle class="rlc-peak-dot" cx="${px}" cy="${py}" r="6" />
        <text class="rlc-peak-label" x="${px + dx}" y="${py - 28}" text-anchor="${anchor}">${marker.lines[0]}</text>
        <text class="rlc-peak-label" x="${px + dx}" y="${py - 10}" text-anchor="${anchor}">${marker.lines[1]}</text>
      `);
    }
  }
  parts.push(`
    <text class="plot-axis-label" x="${width - margin.right}" y="${height - 3}" text-anchor="end">${xLabel}</text>
    <text class="plot-axis-label" x="14" y="${margin.top}" text-anchor="start">${yLabel}</text>
  `);
  return parts.join("");
}

function poleZeroChart(model) {
  const size = 440;
  const margin = 50;
  const plotSize = size - 2 * margin;
  const extent = 1.35 * Math.max(...model.poles.map((pole) => Math.hypot(pole.re, pole.im)));
  const scale = plotSize / (2 * extent);
  const px = (value) => margin + (value + extent) * scale;
  const py = (value) => margin + (extent - value) * scale;
  const parts = [
    `<rect x="${margin}" y="${margin}" width="${plotSize / 2}" height="${plotSize}" fill="var(--accent)" fill-opacity="0.07" />`,
  ];

  for (const tick of niceTicks(-extent, extent, 6)) {
    const axisClass = tick === 0 ? "plot-axis-line" : "plot-grid-line";
    parts.push(`
      <line class="${axisClass}" x1="${px(tick)}" y1="${margin}" x2="${px(tick)}" y2="${size - margin}" />
      <line class="${axisClass}" x1="${margin}" y1="${py(tick)}" x2="${size - margin}" y2="${py(tick)}" />
      <text class="plot-tick-label" x="${px(tick)}" y="${size - margin + 16}" text-anchor="middle">${formatNumber(tick)}</text>
    `);
    if (tick !== 0) {
      parts.push(`<text class="plot-tick-label" x="${margin - 8}" y="${py(tick) + 4}" text-anchor="end">${formatNumber(tick)}</text>`);
    }
  }
  parts.push(`
    <text class="plot-annotation" x="${margin + 8}" y="${margin + 16}">Semiplano izquierdo (estable)</text>
    <text class="plot-axis-label" x="${size - margin}" y="${size - 8}" text-anchor="end">σ (rad/s)</text>
    <text class="plot-axis-label" x="${margin + 6}" y="${margin - 28}" text-anchor="start">jω (rad/s)</text>
  `);

  const double = model.kind === "critical";
  model.poles.forEach((pole, index) => {
    const cx = px(pole.re);
    const cy = py(pole.im);
    const arm = 8;
    parts.push(`
      <line x1="${cx - arm}" y1="${cy - arm}" x2="${cx + arm}" y2="${cy + arm}" stroke="${colors.output}" stroke-width="3.5" stroke-linecap="round" />
      <line x1="${cx - arm}" y1="${cy + arm}" x2="${cx + arm}" y2="${cy - arm}" stroke="${colors.output}" stroke-width="3.5" stroke-linecap="round" />
    `);
    if (double && index === 1) return;
    const name = double ? "s₁ = s₂" : `s${index === 0 ? "₁" : "₂"}`;
    const labelX = Math.min(Math.max(cx, margin + 62), size - margin - 62);
    const above = pole.im >= 0;
    const labelY = above ? cy - 16 : cy + 26;
    parts.push(`<text class="rlc-pole-label" x="${labelX}" y="${labelY}" text-anchor="middle">${name} = ${formatComplex(pole.re, pole.im)}</text>`);
  });
  return parts.join("");
}

const kindNames = {
  under: "Subamortiguado (polos complejos conjugados)",
  critical: "Críticamente amortiguado (polo real doble)",
  over: "Sobreamortiguado (dos polos reales distintos)",
};

function render() {
  const params = readParameters();
  if (params.error) {
    errorMessage.textContent = `⚠ ${params.error}`;
    errorMessage.hidden = false;
    return;
  }
  errorMessage.hidden = true;
  errorMessage.textContent = "";

  const model = analyze(params);
  const slowest = Math.min(...model.poles.map((pole) => Math.abs(pole.re)));
  let span = 6 / slowest;
  if (model.kind === "under") {
    const period = (2 * Math.PI) / model.poles[0].im;
    span = Math.min(span, 200 * period);
    span = Math.max(span, 2 * period);
  }
  const unit = span < 1e-3 ? "us" : span < 1 ? "ms" : "s";
  const factor = { us: 1e6, ms: 1e3, s: 1 }[unit];
  const unitLabel = { us: "µs", ms: "ms", s: "s" }[unit];

  const tMin = -span / 10;
  const sampleCount = model.kind === "under"
    ? Math.min(8000, Math.max(800, Math.ceil((span * model.poles[0].im) / (2 * Math.PI) * 40)))
    : 800;
  const output = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const time = (span * index) / (sampleCount - 1);
    output.push([time * factor, stepValue(model, time)]);
  }
  output.unshift([tMin * factor, 0]);
  const input = [[tMin * factor, 0], [0, 0], [0, params.amplitude], [span * factor, params.amplitude]];

  const peak = Math.max(...output.map(([, value]) => value));
  const top = Math.max(peak, params.amplitude);
  const padding = top * 0.12;
  const markers = [];
  if (model.kind === "under") {
    const peakTime = Math.PI / model.poles[0].im;
    const overshootPercent = Math.exp((-Math.PI * model.zeta) / Math.sqrt(1 - model.zeta ** 2)) * 100;
    markers.push({
      x: peakTime * factor,
      y: stepValue(model, peakTime),
      lines: [
        `Sobreimpulso: ${formatNumber(overshootPercent)} %`,
        `${formatNumber(stepValue(model, peakTime))} V en t = ${formatSeconds(peakTime)}`,
      ],
    });
  }
  stepPlot.innerHTML = stepChart({
    markers,
    series: [
      { points: input, color: colors.input, width: 2, dashed: true },
      { points: output, color: colors.output, width: 3 },
    ],
    xRange: [tMin * factor, span * factor],
    yRange: [-padding * 0.4, top + padding],
    xLabel: `t (${unitLabel})`,
    yLabel: "y(t) (V)",
  });
  stepPlot.setAttribute(
    "aria-label",
    `Respuesta al escalón de ${formatNumber(params.amplitude)} voltios del circuito RLC, régimen ${kindNames[model.kind]}`,
  );

  polePlot.innerHTML = poleZeroChart(model);
  polePlot.setAttribute(
    "aria-label",
    `Diagrama de polos y ceros: ${model.poles.map((pole, index) => `polo ${index + 1} en ${formatComplex(pole.re, pole.im)} radianes por segundo`).join(", ")}; sin ceros finitos`,
  );
  poleNote.textContent = model.kind === "under"
    ? "Los polos complejos conjugados dan una respuesta oscilante amortiguada: cuanto más cerca del eje jω, menos amortiguamiento."
    : model.kind === "critical"
      ? "Polo real doble: la respuesta más rápida posible sin oscilar."
      : "Dos polos reales: el más cercano al origen domina la respuesta lenta.";
  dampingBadge.textContent = `ζ = ${formatNumber(model.zeta)}`;
  stabilityBadge.textContent = "Estable (polos con parte real negativa)";

  const rows = [
    ["Régimen", kindNames[model.kind]],
    ["Frecuencia natural ω<sub>0</sub>", `${formatNumber(model.omega0)} rad/s (${formatNumber(model.omega0 / (2 * Math.PI))} Hz)`],
    ["Coeficiente de amortiguamiento ζ", formatNumber(model.zeta)],
    ["Valor final", `${formatNumber(params.amplitude)} V`],
  ];
  if (model.kind === "under") {
    const wd = model.poles[0].im;
    const overshoot = Math.exp((-Math.PI * model.zeta) / Math.sqrt(1 - model.zeta ** 2)) * 100;
    rows.push(
      ["Sobreimpulso", `${formatNumber(overshoot)} %`],
      ["Instante del primer pico", formatSeconds(Math.PI / wd)],
    );
  } else {
    rows.push(["Sobreimpulso", "0 %"]);
  }
  rows.push(["Tiempo de establecimiento (2 %, aprox.)", formatSeconds(4 / slowest)]);
  readouts.innerHTML = rows.map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("");

  if (model.kind === "under") {
    const wd = model.poles[0].im;
    const tp = Math.PI / wd;
    const mp = Math.exp((-Math.PI * model.zeta) / Math.sqrt(1 - model.zeta ** 2));
    const zeta = -Math.log(mp) / Math.sqrt(Math.PI ** 2 + Math.log(mp) ** 2);
    const omega0 = Math.PI / (tp * Math.sqrt(1 - zeta ** 2));
    const w2 = omega0 * omega0;
    identifyValues.innerHTML = [
      ["M<sub>p</sub> medido", `${formatNumber(mp)} (${formatNumber(mp * 100)} %)`],
      ["t<sub>p</sub> medido", formatSeconds(tp)],
      ["ζ calculado", formatNumber(zeta)],
      ["ω<sub>d</sub> = π / t<sub>p</sub>", `${formatNumber(wd)} rad/s`],
      ["ω<sub>0</sub> calculado", `${formatNumber(omega0)} rad/s`],
      ["H(s) resultante", `${formatNumber(w2)} / (s² + ${formatNumber(2 * zeta * omega0)} s + ${formatNumber(w2)})`],
    ].map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("");
    identifyNote.textContent = "Con los valores leídos en la gráfica de este circuito se recupera la misma H(s) que obtienes a partir de R, L y C.";
  } else {
    identifyValues.innerHTML = "";
    identifyNote.textContent = "Este método solo se aplica a un sistema de segundo orden subamortiguado, que es el único régimen con sobreimpulso. Reduce R para verlo.";
  }
}

document.querySelector("#rlc-form").addEventListener("submit", (event) => event.preventDefault());
for (const field of Object.values(fields)) field.addEventListener("input", render);

render();
