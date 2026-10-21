const dampingInput = document.querySelector("#so-damping");
const frequencyInput = document.querySelector("#so-frequency");
const stepPlot = document.querySelector("#so-step-plot");
const colors = { input: "var(--answer)", output: "#d97706" };
const numberFormat = new Intl.NumberFormat("es", { maximumFractionDigits: 3 });
const formatNumber = (value) => numberFormat.format(Math.abs(value) < 1e-12 ? 0 : value);
const formatComplex = (real, imag) => imag === 0 ? formatNumber(real) : `${formatNumber(real)} ${imag > 0 ? "+" : "−"} j${formatNumber(Math.abs(imag))}`;

// Modelo normalizado, de ganancia estática unitaria y condiciones iniciales nulas.
function analyze(zeta, omega0) {
  const alpha = zeta * omega0;
  if (zeta === 1) return { zeta, omega0, alpha, kind: "critical", poles: [{ re: -omega0, im: 0 }, { re: -omega0, im: 0 }] };
  if (zeta < 1) {
    const wd = omega0 * Math.sqrt(1 - zeta * zeta);
    return { zeta, omega0, alpha, kind: "under", poles: [{ re: -alpha, im: wd }, { re: -alpha, im: -wd }] };
  }
  // Evita la resta de dos números cercanos al calcular el polo lento.
  const fast = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
  return { zeta, omega0, alpha, kind: "over", poles: [{ re: omega0 * omega0 / fast, im: 0 }, { re: fast, im: 0 }] };
}

function stepValue(model, time) {
  if (time <= 0) return 0;
  const { alpha, kind, poles } = model;
  if (kind === "under") {
    const wd = poles[0].im;
    return 1 - Math.exp(-alpha * time) * (Math.cos(wd * time) + alpha / wd * Math.sin(wd * time));
  }
  if (kind === "critical") return 1 - (1 + alpha * time) * Math.exp(-alpha * time);
  const p1 = poles[0].re;
  const p2 = poles[1].re;
  return 1 + (p2 * Math.exp(p1 * time) - p1 * Math.exp(p2 * time)) / (p1 - p2);
}

// Última entrada en la banda del 2 %, incluso si ocurre después de los 5 s visibles.
function settlingTime(model) {
  if (model.zeta === 0) return null;
  let left = 0;
  let right;
  if (model.kind === "under") {
    const halfPeriod = Math.PI / model.poles[0].im;
    // Los extremos del error ocurren en kπ/ωd y valen exp(−αkπ/ωd).
    const lastPeak = Math.max(0, Math.ceil(Math.log(50) / (model.alpha * halfPeriod)) - 1);
    left = lastPeak * halfPeriod;
    right = left + halfPeriod;
  } else {
    right = 1 / model.omega0;
    while (Math.abs(stepValue(model, right) - 1) > 0.02) right *= 2;
  }
  for (let iteration = 0; iteration < 60; iteration += 1) {
    const middle = (left + right) / 2;
    if (Math.abs(stepValue(model, middle) - 1) > 0.02) left = middle;
    else right = middle;
  }
  return right;
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

function stepChart({ series, xRange, yRange, xLabel, yLabel, markers = [], settlingMarker = null }) {
  const bounds = stepPlot.getBoundingClientRect();
  const width = bounds.width || 800;
  const height = bounds.height || 480;
  stepPlot.setAttribute("viewBox", `0 0 ${width} ${height}`);
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
        <line x1="${px}" y1="${y(1)}" x2="${px}" y2="${py}" stroke="${colors.output}" stroke-width="3" />
        <text class="rlc-peak-label" x="${px + dx}" y="${py - 28}" text-anchor="${anchor}">${marker.lines[0]}</text>
        <text class="rlc-peak-label" x="${px + dx}" y="${py - 10}" text-anchor="${anchor}">${marker.lines[1]}</text>
      `);
    }
  }
  if (settlingMarker !== null && settlingMarker.time <= xRange[1]) {
    const px = x(settlingMarker.time);
    const anchor = px > width - margin.right - 200 ? "end" : "start";
    const dx = anchor === "end" ? -8 : 8;
    parts.push(`
      <line class="so-settling-marker" x1="${px}" y1="${margin.top}" x2="${px}" y2="${height - margin.bottom}" stroke="var(--highlight)" stroke-width="2" stroke-dasharray="6 5" />
      <circle cx="${px}" cy="${y(settlingMarker.value)}" r="5" fill="var(--highlight)" />
      <text class="plot-annotation" x="${px + dx}" y="${y(0.4)}" text-anchor="${anchor}">Establecimiento</text>
      <text class="plot-annotation" x="${px + dx}" y="${y(0.4) + 20}" text-anchor="${anchor}">tₛ = ${formatNumber(settlingMarker.time)} s</text>
    `);
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
  // Rango fijo del plano s, independiente de los deslizadores.
  const extent = 20;
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


function render() {
  const zeta = Number(dampingInput.value);
  const omega0 = Number(frequencyInput.value);
  const error = document.querySelector("#so-error");
  const valid = Number.isFinite(zeta) && zeta >= 0 && zeta <= 2 && Number.isFinite(omega0) && omega0 >= 0.5 && omega0 <= 10;
  error.hidden = valid;
  if (!valid) {
    error.textContent = "Elige ζ entre 0 y 2 y ω₀ entre 0,5 y 10 rad/s.";
    return;
  }
  const model = analyze(zeta, omega0);
  const regime = zeta === 0 ? "Sin amortiguamiento" : zeta < 1 ? "Subamortiguado" : zeta === 1 ? "Críticamente amortiguado" : "Sobreamortiguado";
  document.querySelector("#so-damping-value").textContent = formatNumber(zeta);
  document.querySelector("#so-frequency-value").textContent = `${formatNumber(omega0)} rad/s`;
  dampingInput.setAttribute("aria-valuetext", `${formatNumber(zeta)}, ${regime}`);
  frequencyInput.setAttribute("aria-valuetext", `${formatNumber(omega0)} radianes por segundo`);
  document.querySelector("#so-regime").textContent = regime;
  document.querySelector("#so-stability").textContent = zeta === 0 ? "No estable BIBO" : "Estable BIBO";
  const output = Array.from({ length: 2401 }, (_, index) => {
    const time = 5 * index / 2400;
    return [time, stepValue(model, time)];
  });
  output.unshift([-1, 0]);
  const peakTime = zeta < 1 ? Math.PI / model.poles[0].im : null;
  const peakValue = peakTime === null ? null : stepValue(model, peakTime);
  const peakDescription = peakTime === null
    ? "Sin sobreimpulso."
    : `Sobreimpulso: ${formatNumber((peakValue - 1) * 100)} %; pico y = ${formatNumber(peakValue)} en t = ${formatNumber(peakTime)} s.`;
  const establishmentTime = settlingTime(model);
  const establishmentDescription = establishmentTime === null
    ? "No existe tiempo de establecimiento."
    : `Tiempo de establecimiento (±2 %): ${formatNumber(establishmentTime)} s.${establishmentTime > 5 ? " Queda fuera de los 5 s mostrados." : ""}`;
  stepPlot.innerHTML = stepChart({
    settlingMarker: establishmentTime === null ? null : { time: establishmentTime, value: stepValue(model, establishmentTime) },
    markers: peakTime !== null && peakTime <= 5 ? [{
      x: peakTime, y: peakValue,
      lines: [`Sobreimpulso: ${formatNumber((peakValue - 1) * 100)} %`, `y = ${formatNumber(peakValue)} · t = ${formatNumber(peakTime)} s`],
    }] : [],
    series: [
      { points: [[-1, 0], [0, 0], [0, 1], [5, 1]], color: colors.input, width: 2, dashed: true },
      { points: output, color: colors.output, width: 3 },
    ],
    xRange: [-1, 5], yRange: [-0.1, 2.2], xLabel: "t (s)", yLabel: "y(t) (adimensional)",
  });
  stepPlot.setAttribute("aria-label", `Respuesta al escalón unitario: ζ = ${formatNumber(zeta)}, ω₀ = ${formatNumber(omega0)} rad/s; ${regime}`);
  stepPlot.setAttribute("aria-label", `${stepPlot.getAttribute("aria-label")}. ${peakDescription} ${establishmentDescription}`);
  document.querySelector("#so-peak-note").textContent = `${peakDescription}${peakTime !== null && peakTime > 5 ? " El primer pico queda fuera de los 5 s mostrados." : ""}`;
  document.querySelector("#so-settling-note").textContent = establishmentDescription;
  const polePlot = document.querySelector("#so-poles-plot");
  polePlot.innerHTML = poleZeroChart(model);
  polePlot.setAttribute("aria-label", `Sin ceros finitos. Polos en ${model.poles.map(p => formatComplex(p.re, p.im)).join(" y ")} rad/s${zeta === 1 ? "; polo doble" : ""}`);
  document.querySelector("#so-response-note").textContent = zeta === 0
    ? "La salida oscila entre 0 y 2 sin decaer; no existe valor final. Aunque este escalón produce una salida acotada, una entrada resonante puede producir una salida sin cota."
    : zeta < 1 ? "La salida oscila con amplitud decreciente y tiende a 1. Al aumentar ζ se reduce el sobreimpulso."
    : zeta === 1 ? "La salida tiende a 1 sin sobreimpulso: es el límite entre polos complejos y reales."
    : "La salida tiende a 1 sin oscilar. El polo más cercano al origen domina la respuesta lenta.";
  document.querySelector("#so-poles-note").textContent = zeta === 0
    ? "Dos polos sobre el eje imaginario: las oscilaciones persisten."
    : zeta < 1 ? "Dos polos complejos conjugados en el semiplano izquierdo."
    : zeta === 1 ? "Polo real doble en s = −ω₀ (multiplicidad 2)."
    : "Dos polos reales negativos distintos.";
  const rows = [
    ["Factor de amortiguamiento ζ", formatNumber(zeta)],
    ["Frecuencia natural ω₀", `${formatNumber(omega0)} rad/s (${formatNumber(omega0 / (2 * Math.PI))} Hz)`],
    ["Valor final", zeta === 0 ? "No existe (oscilación permanente)" : "1"],
    ["Sobreimpulso", zeta < 1 ? `${formatNumber(100 * Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta)))} %` : "0 %"],
    ["Instante del primer pico", zeta < 1 ? `${formatNumber(Math.PI / model.poles[0].im)} s` : "Sin pico"],
    ["Tiempo de establecimiento (±2 %)", establishmentTime === null ? "No existe (oscilación permanente)" : `${formatNumber(establishmentTime)} s`],
  ];
  document.querySelector("#so-readouts").innerHTML = rows.map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("");
}

dampingInput.addEventListener("input", render);
frequencyInput.addEventListener("input", render);
let lastPlotSize = "";
new ResizeObserver(() => {
  const bounds = stepPlot.getBoundingClientRect();
  const size = `${bounds.width.toFixed(2)}:${bounds.height.toFixed(2)}`;
  if (size === lastPlotSize) return;
  lastPlotSize = size;
  render();
}).observe(stepPlot);
render();
