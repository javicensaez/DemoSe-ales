const samplesPerBit = 40;
const bitCount = 8;
const sampleIntervalMs = 1;
const sampleCount = samplesPerBit * bitCount;
const shapes = {
  cosine: { name: "Coseno elevado", value: phase => Math.sin(Math.PI * phase) ** 2 },
  rect: { name: "Rectangular", value: () => 1 },
  triangle: { name: "Triangular", value: phase => 1 - Math.abs(2 * phase - 1) },
  "half-sine": { name: "Medio seno", value: phase => Math.sin(Math.PI * phase) },
  bipolar: { name: "Seno bipolar", value: phase => Math.sin(2 * Math.PI * phase) },
};
const shapeSelect = document.querySelector("#corr-shape");
const noiseInput = document.querySelector("#corr-noise");
const shiftInput = document.querySelector("#corr-shift");
const numberFormat = new Intl.NumberFormat("es", { maximumFractionDigits: 3 });
const formatNumber = value => numberFormat.format(Math.abs(value) < 1e-12 ? 0 : value);
let bits = randomBits();
let baseNoise = randomNoise(sampleCount);
let signalState;

function randomBits() {
  const result = Array.from({ length: bitCount }, () => Math.random() < 0.5 ? 0 : 1);
  // Mantiene ejemplos de ambos símbolos sin fijar sus posiciones.
  if (result.every(bit => bit === result[0])) result[Math.floor(Math.random() * bitCount)] = 1 - result[0];
  return result;
}

function randomNoise(count) {
  return Array.from({ length: count }, () => {
    const u = 1 - Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  });
}

function makePulse(key) {
  return Array.from({ length: samplesPerBit }, (_, j) => shapes[key].value((j + 0.5) / samplesPerBit));
}

function transmit(sequence, pulse) {
  return sequence.flatMap(bit => pulse.map(value => bit * value));
}

function correlate(received, pulse) {
  const energy = pulse.reduce((sum, value) => sum + value * value, 0);
  return Array.from({ length: received.length - pulse.length + 1 }, (_, k) =>
    pulse.reduce((sum, value, j) => sum + value * received[k + j], 0) / energy,
  );
}

function niceTicks(min, max, count = 6) {
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * magnitude;
  const ticks = [];
  for (let i = Math.ceil(min / step); i * step <= max + step * 1e-9; i += 1) ticks.push(i * step);
  return ticks;
}

function chartMarkup({ curves, duration, yRange, yLabel, marker = null, threshold = null, decisions = [] }) {
  const left = 65, right = 775, top = 24, bottom = 214;
  const x = value => left + value / duration * (right - left);
  const y = value => top + (yRange[1] - value) / (yRange[1] - yRange[0]) * (bottom - top);
  const parts = [];
  const ticks = duration === 320 ? Array.from({ length: 9 }, (_, i) => 40 * i) : [0, 10, 20, 30, 40];
  for (const tick of ticks) {
    parts.push(`<line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${top}" x2="${x(tick)}" y2="${bottom}" /><text class="plot-tick-label" x="${x(tick)}" y="236" text-anchor="middle">${formatNumber(tick)}</text>`);
  }
  for (const tick of niceTicks(yRange[0], yRange[1])) {
    parts.push(`<line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${left}" y1="${y(tick)}" x2="${right}" y2="${y(tick)}" /><text class="plot-tick-label" x="${left - 10}" y="${y(tick) + 4}" text-anchor="end">${formatNumber(tick)}</text>`);
  }
  if (marker !== null) {
    parts.push(`<rect x="${x(marker)}" y="${top}" width="${x(40) - x(0)}" height="${bottom - top}" fill="var(--highlight)" fill-opacity="0.07" />`);
  }
  if (threshold !== null) {
    parts.push(`<line x1="${left}" y1="${y(threshold)}" x2="${right}" y2="${y(threshold)}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 5" /><text class="plot-annotation" x="${right - 8}" y="${y(threshold) - 8}" text-anchor="end">Umbral 0,5</text>`);
  }
  for (const curve of curves) {
    const points = curve.values.map((value, i) => [curve.offset + i * sampleIntervalMs, value]);
    const path = points.map(([time, value], i) => `${i ? "L" : "M"}${x(time).toFixed(2)},${y(value).toFixed(2)}`).join(" ");
    const dash = curve.dash ?? (curve.dashed ? "7 5" : null);
    parts.push(`<path d="${path}" fill="none" stroke="${curve.color}" stroke-width="${curve.width ?? 2.5}" ${dash ? `stroke-dasharray="${dash}"` : ""} vector-effect="non-scaling-stroke" />`);
  }
  for (const decision of decisions) {
    parts.push(`<circle cx="${x(decision.time)}" cy="${y(decision.value)}" r="4" fill="var(--highlight)" stroke="var(--surface)" stroke-width="1.5"><title>Símbolo ${decision.index + 1}: C = ${formatNumber(decision.value)}, bit detectado ${decision.bit}</title></circle>`);
  }
  if (marker !== null) parts.push(`<line x1="${x(marker)}" y1="${top}" x2="${x(marker)}" y2="${bottom}" stroke="#d97706" stroke-width="2" stroke-dasharray="4 4" />`);
  parts.push(`<text class="plot-axis-label" x="${right}" y="258" text-anchor="end">${threshold === null ? "t (ms)" : "Desplazamiento (ms)"}</text><text class="plot-axis-label" x="14" y="16">${yLabel}</text>`);
  return parts.join("");
}

function rangeFor(values, include = []) {
  const min = Math.min(0, ...values, ...include);
  const max = Math.max(1, ...values, ...include);
  const padding = (max - min) * 0.16;
  return [min - padding, max + padding];
}

function renderBits(detected) {
  document.querySelector("#corr-sent-bits").innerHTML = bits.map((bit, i) =>
    `<span class="correlation-bit" aria-label="Símbolo ${i + 1}: ${bit}"><small>${i + 1}</small><strong>${bit}</strong></span>`,
  ).join("");
  document.querySelector("#corr-detected-bits").innerHTML = detected.map((bit, i) => {
    const correct = bit === bits[i];
    return `<span class="correlation-bit ${correct ? "is-match" : "is-mismatch"}" aria-label="Símbolo ${i + 1}: ${bit}, ${correct ? "correcto" : "error"}"><small>${i + 1}</small><strong>${bit}</strong><small>${correct ? "✓" : "Error"}</small></span>`;
  }).join("");
  const errors = detected.filter((bit, i) => bit !== bits[i]).length;
  document.querySelector("#corr-detection-summary").textContent = `${bitCount - errors} de ${bitCount} bits correctos (${formatNumber(100 * (bitCount - errors) / bitCount)} %). ${errors} ${errors === 1 ? "error" : "errores"}. El detector usa solo la señal recibida y el pulso conocido.`;
}

function renderShift() {
  if (!signalState) return;
  const shift = Number(shiftInput.value);
  if (!Number.isInteger(shift) || shift < 0 || shift > sampleCount - samplesPerBit) return;
  const { pulse, transmitted, received, correlation, yRange, correlationRange, decisions } = signalState;
  document.querySelector("#corr-shift-value").textContent = `${formatNumber(shift)} ms`;
  shiftInput.setAttribute("aria-valuetext", `${formatNumber(shift)} milisegundos`);
  document.querySelector("#corr-received-plot").innerHTML = chartMarkup({
    curves: [
      { values: received, offset: 0.5, color: "var(--answer)", width: 1.7 },
      { values: transmitted, offset: 0.5, color: "var(--wave)", width: 3, dash: "12 4" },
      { values: [0, ...pulse, 0], offset: shift - 0.5, color: "#d97706", dashed: true },
    ], duration: sampleCount, yRange, yLabel: "Amplitud", marker: shift,
  });
  document.querySelector("#corr-received-plot").setAttribute("aria-label", `Señal transmitida con trazo largo discontinuo superpuesta a la señal recibida con ruido, y pulso de referencia colocado a partir de ${shift} milisegundos`);
  document.querySelector("#corr-correlation-plot").innerHTML = chartMarkup({
    curves: [{ values: correlation, offset: 0, color: "var(--wave)" }],
    duration: sampleCount, yRange: correlationRange, yLabel: "C (normalizada)", marker: shift, threshold: 0.5, decisions,
  });
  document.querySelector("#corr-correlation-plot").setAttribute("aria-label", `Correlación cruzada normalizada; desplazamiento actual ${shift} milisegundos, valor ${formatNumber(correlation[shift])}. Umbral de decisión 0,5`);
  document.querySelector("#corr-current-value").textContent = `Desplazamiento ${shift} ms: C = ${formatNumber(correlation[shift])}. ${shift % samplesPerBit === 0 ? `Inicio de símbolo: el detector decide ${correlation[shift] >= 0.5 ? "1" : "0"}.` : "Posición intermedia: no se toma una decisión de bit aquí."}`;
}

function render() {
  const sigma = Number(noiseInput.value);
  const error = document.querySelector("#corr-error");
  const valid = Number.isFinite(sigma) && sigma >= 0 && sigma <= 2 && Object.hasOwn(shapes, shapeSelect.value);
  error.hidden = valid;
  if (!valid) { error.textContent = "Elige una forma de onda de la lista y un nivel de ruido entre 0 y 2."; return; }
  const pulse = makePulse(shapeSelect.value);
  const transmitted = transmit(bits, pulse);
  const received = transmitted.map((value, i) => value + sigma * baseNoise[i]);
  const correlation = correlate(received, pulse);
  const decisions = bits.map((_, i) => ({ index: i, time: i * samplesPerBit, value: correlation[i * samplesPerBit], bit: correlation[i * samplesPerBit] >= 0.5 ? 1 : 0 }));
  const yRange = rangeFor(received, pulse);
  signalState = { pulse, transmitted, received, correlation, decisions, yRange, correlationRange: rangeFor(correlation, [0.5]) };
  document.querySelector("#corr-noise-value").textContent = formatNumber(sigma);
  noiseInput.setAttribute("aria-valuetext", `Desviación típica del ruido ${formatNumber(sigma)}`);
  document.querySelector("#corr-template-name").textContent = shapes[shapeSelect.value].name;
  document.querySelector("#corr-template-plot").innerHTML = chartMarkup({ curves: [{ values: [0, ...pulse, 0], offset: -0.5, color: "var(--wave)" }], duration: 40, yRange: rangeFor(pulse), yLabel: "Amplitud" });
  document.querySelector("#corr-template-plot").setAttribute("aria-label", `Pulso ${shapes[shapeSelect.value].name}, duración 40 milisegundos`);
  document.querySelector("#corr-transmitted-plot").innerHTML = chartMarkup({ curves: [{ values: transmitted, offset: 0.5, color: "var(--answer)" }], duration: sampleCount, yRange, yLabel: "Amplitud" });
  document.querySelector("#corr-transmitted-plot").setAttribute("aria-label", `Señal transmitida de 320 milisegundos, secuencia ${bits.join(" ")}`);
  renderBits(decisions.map(decision => decision.bit));
  renderShift();
}

shapeSelect.addEventListener("change", render);
noiseInput.addEventListener("input", render);
shiftInput.addEventListener("input", renderShift);
document.querySelector("#corr-new-sequence").addEventListener("click", () => { bits = randomBits(); baseNoise = randomNoise(sampleCount); shiftInput.value = 0; render(); });
document.querySelector("#corr-new-noise").addEventListener("click", () => { baseNoise = randomNoise(sampleCount); render(); });
render();
