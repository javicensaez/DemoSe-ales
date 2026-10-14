const soundSpeed = 343;
const sampleRate = 48000;
const chirpDuration = 0.003;
const recordDuration = 0.035;
const fields = Object.fromEntries(["baseline", "distance", "size", "noise"].map(name => [name, document.querySelector(`#sonar-${name}`)]));
const numberFormat = new Intl.NumberFormat("es", { maximumFractionDigits: 3 });
const formatNumber = value => numberFormat.format(Math.abs(value) < 1e-12 ? 0 : value);
const chirpSamples = Array.from({ length: Math.round(chirpDuration * sampleRate) }, (_, i) => chirp(i / sampleRate));
const chirpEnergy = chirpSamples.reduce((sum, value) => sum + value * value, 0);
let baseNoise = randomNoise(Math.round(recordDuration * sampleRate));
let animationFrame = null;
let currentModel;

function chirp(time) {
  if (time <= 0 || time >= chirpDuration) return 0;
  const phase = 2 * Math.PI * (2000 * time + (6000 - 2000) * time * time / (2 * chirpDuration));
  return Math.sin(Math.PI * time / chirpDuration) ** 2 * Math.sin(phase);
}

function randomNoise(count) {
  return Array.from({ length: count }, () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()));
}

function echoDelay(distance, baseline) {
  return (distance + Math.hypot(distance, baseline)) / soundSpeed;
}

function distanceFromDelay(delay, baseline) {
  const length = soundSpeed * delay;
  return (length * length - baseline * baseline) / (2 * length);
}

function simulate({ distance, baseline, size, noise }, noiseSamples) {
  const directDelay = baseline / soundSpeed;
  const delay = echoDelay(distance, baseline);
  const echoAmplitude = 0.65 * (size / 1.7) ** 2 / (distance * Math.hypot(distance, baseline));
  const directAmplitude = 0.6 / (1 + baseline / 0.3);
  const clean = noiseSamples.map((_, i) => directAmplitude * chirp(i / sampleRate - directDelay) + echoAmplitude * chirp(i / sampleRate - delay));
  const received = clean.map((value, i) => value + noise * noiseSamples[i]);
  return { clean, received, directDelay, delay, echoAmplitude };
}

function crossCorrelation(received) {
  return Array.from({ length: received.length - chirpSamples.length + 1 }, (_, k) => {
    let sum = 0;
    for (let j = 0; j < chirpSamples.length; j += 1) sum += chirpSamples[j] * received[k + j];
    return sum / chirpEnergy;
  });
}

// El detector recibe solo la correlación, la separación conocida y el nivel de ruido.
function detectEcho(correlation, baseline, noise) {
  const minDelay = echoDelay(1, baseline);
  const maxDelay = echoDelay(4, baseline);
  const first = Math.ceil(minDelay * sampleRate);
  const last = Math.min(correlation.length - 2, Math.floor(maxDelay * sampleRate));
  let peakIndex = first;
  for (let i = first + 1; i <= last; i += 1) if (correlation[i] > correlation[peakIndex]) peakIndex = i;
  const threshold = 5 * noise / Math.sqrt(chirpEnergy);
  const detected = correlation[peakIndex] > threshold;
  // Ajuste parabólico local para estimar retardos entre dos muestras.
  const left = correlation[peakIndex - 1];
  const center = correlation[peakIndex];
  const right = correlation[peakIndex + 1];
  const denominator = left - 2 * center + right;
  const offset = Math.abs(denominator) > 1e-12 ? Math.max(-0.5, Math.min(0.5, 0.5 * (left - right) / denominator)) : 0;
  const delay = Math.max(minDelay, Math.min(maxDelay, (peakIndex + offset) / sampleRate));
  return { detected, delay, distance: detected ? distanceFromDelay(delay, baseline) : null, peak: center, threshold, minDelay, maxDelay };
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

function rangeFor(values, extra = []) {
  const min = Math.min(0, ...values, ...extra);
  const max = Math.max(0.05, ...values, ...extra);
  const padding = (max - min) * 0.2;
  return [min - padding, max + padding];
}

function chartMarkup({ curves, durationMs, yRange, yLabel, markers = [], searchRange = null, threshold = null }) {
  const left = 66, right = 775, top = 34, bottom = 230;
  const x = time => left + time / durationMs * (right - left);
  const y = value => top + (yRange[1] - value) / (yRange[1] - yRange[0]) * (bottom - top);
  const parts = [];
  if (searchRange) parts.push(`<rect x="${x(searchRange[0])}" y="${top}" width="${x(searchRange[1]) - x(searchRange[0])}" height="${bottom - top}" fill="var(--highlight)" fill-opacity="0.1" />`);
  for (const tick of niceTicks(0, durationMs)) {
    parts.push(`<line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${top}" x2="${x(tick)}" y2="${bottom}" /><text class="plot-tick-label" x="${x(tick)}" y="251" text-anchor="middle">${formatNumber(tick)}</text>`);
  }
  for (const tick of niceTicks(yRange[0], yRange[1])) {
    parts.push(`<line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${left}" y1="${y(tick)}" x2="${right}" y2="${y(tick)}" /><text class="plot-tick-label" x="${left - 10}" y="${y(tick) + 4}" text-anchor="end">${formatNumber(tick)}</text>`);
  }
  if (threshold !== null) parts.push(`<line x1="${left}" y1="${y(threshold)}" x2="${right}" y2="${y(threshold)}" stroke="var(--muted)" stroke-dasharray="5 5" /><text class="plot-annotation" x="${right - 8}" y="${y(threshold) - 6}" text-anchor="end">Umbral de detección</text>`);
  for (const curve of curves) {
    const path = curve.values.map((value, i) => `${i ? "L" : "M"}${x(1000 * i / sampleRate).toFixed(2)},${y(value).toFixed(2)}`).join(" ");
    parts.push(`<path d="${path}" fill="none" stroke="${curve.color}" stroke-width="${curve.width ?? 2}" ${curve.dashed ? 'stroke-dasharray="7 5"' : ""} vector-effect="non-scaling-stroke" />`);
  }
  for (const marker of markers) {
    const px = x(marker.time * 1000);
    const color = marker.color ?? "#d97706";
    const anchor = px > right - 220 ? "end" : "start";
    const dx = anchor === "end" ? -6 : 6;
    parts.push(`<line x1="${px}" y1="${top}" x2="${px}" y2="${bottom}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 4" /><text class="plot-annotation" x="${px + dx}" y="${marker.labelY ?? 48}" text-anchor="${anchor}">${marker.label}</text>`);
    if (marker.value !== undefined) parts.push(`<circle cx="${px}" cy="${y(marker.value)}" r="4" fill="${color}" />`);
  }
  parts.push(`<text class="plot-axis-label" x="${right}" y="277" text-anchor="end">${searchRange ? "Retardo (ms)" : "t (ms)"}</text><text class="plot-axis-label" x="12" y="16">${yLabel}</text>`);
  return parts.join("");
}

function scenePositions(model) {
  return { speaker: { x: 80, y: 125 }, person: { x: 180 + 120 * model.distance, y: 125 }, microphone: { x: 80, y: 125 + 115 * model.baseline } };
}

function renderScene(model) {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  const { speaker: s, person: p, microphone: m } = scenePositions(model);
  const height = model.size * 35;
  const scene = document.querySelector("#sonar-scene");
  scene.innerHTML = `
    <line x1="${s.x}" y1="45" x2="${p.x}" y2="45" stroke="var(--axis)" stroke-width="2" />
    <text class="plot-axis-label" x="${(s.x + p.x) / 2}" y="35" text-anchor="middle">Distancia d = ${formatNumber(model.distance)} m</text>
    <path d="M${s.x},${s.y} L${p.x},${p.y} L${m.x},${m.y}" fill="none" stroke="var(--wave)" stroke-width="3" />
    <line x1="${s.x}" y1="${s.y}" x2="${m.x}" y2="${m.y}" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5 5" />
    <rect x="43" y="110" width="15" height="30" rx="3" fill="var(--surface)" stroke="var(--accent)" stroke-width="2" />
    <path d="M58,115 L76,104 L76,146 L58,135 Z" fill="var(--accent)" />
    <text class="plot-axis-label" x="45" y="85">Altavoz</text>
    <circle cx="${m.x}" cy="${m.y}" r="8" fill="var(--surface)" stroke="var(--accent)" stroke-width="3" />
    <text class="plot-axis-label" x="30" y="255">Micrófono</text>
    <text class="plot-annotation" x="100" y="${m.y + 28}">b = ${formatNumber(model.baseline * 100)} cm</text>
    <g stroke="var(--accent)" stroke-width="6" stroke-linecap="round" fill="var(--surface)">
      <circle cx="${p.x}" cy="${p.y - height / 2}" r="9" />
      <path d="M${p.x},${p.y - height / 2 + 14} V${p.y + height / 4} M${p.x - 16},${p.y - height / 5} L${p.x},${p.y - height / 8} L${p.x + 16},${p.y - height / 5} M${p.x},${p.y + height / 4} L${p.x - 12},${p.y + height / 2} M${p.x},${p.y + height / 4} L${p.x + 12},${p.y + height / 2}" />
    </g>
    <text class="plot-axis-label" x="${p.x}" y="${p.y + height / 2 + 32}" text-anchor="middle">Persona · ${formatNumber(model.size)} m</text>
    <circle id="sonar-wave-dot" cx="${s.x}" cy="${s.y}" r="7" fill="#d97706" visibility="hidden" />
  `;
  scene.setAttribute("aria-label", `Altavoz y micrófono separados ${formatNumber(model.baseline * 100)} centímetros; persona a ${formatNumber(model.distance)} metros y de altura ${formatNumber(model.size)} metros. Recorrido de ida y vuelta del sonido.`);
}

function animateEmission() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const model = currentModel;
  const { speaker: s, person: p, microphone: m } = scenePositions(model);
  const outboundFraction = model.distance / (model.distance + Math.hypot(model.distance, model.baseline));
  const dot = document.querySelector("#sonar-wave-dot");
  const start = performance.now();
  dot.setAttribute("visibility", "visible");
  function frame(now) {
    const progress = Math.min(1, (now - start) / 1400);
    const outbound = progress <= outboundFraction;
    const from = outbound ? s : p;
    const to = outbound ? p : m;
    const local = outbound ? progress / outboundFraction : (progress - outboundFraction) / (1 - outboundFraction);
    dot.setAttribute("cx", from.x + (to.x - from.x) * local);
    dot.setAttribute("cy", from.y + (to.y - from.y) * local);
    if (progress < 1) animationFrame = requestAnimationFrame(frame);
    else { dot.setAttribute("visibility", "hidden"); animationFrame = null; }
  }
  animationFrame = requestAnimationFrame(frame);
}

function readParameters() {
  const values = {};
  for (const [name, input] of Object.entries(fields)) {
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < Number(input.min) || value > Number(input.max)) return null;
    values[name] = value;
  }
  return values;
}

function render() {
  const model = readParameters();
  const error = document.querySelector("#sonar-error");
  error.hidden = model !== null;
  if (!model) { error.textContent = "Ajusta los controles dentro de los rangos indicados."; return; }
  currentModel = model;
  for (const [name, value] of Object.entries(model)) {
    const label = name === "baseline" ? `${formatNumber(value * 100)} cm` : name === "noise" ? formatNumber(value) : `${formatNumber(value)} m`;
    document.querySelector(`#sonar-${name}-value`).textContent = label;
    fields[name].setAttribute("aria-valuetext", label);
  }
  renderScene(model);
  const signal = simulate(model, baseNoise);
  const correlation = crossCorrelation(signal.received);
  const estimate = detectEcho(correlation, model.baseline, model.noise);
  document.querySelector("#sonar-emitted-plot").innerHTML = chartMarkup({ curves: [{ values: [...chirpSamples, 0], color: "var(--wave)" }], durationMs: 3, yRange: [-1.2, 1.2], yLabel: "Amplitud" });
  document.querySelector("#sonar-received-plot").innerHTML = chartMarkup({
    curves: [{ values: signal.received, color: "var(--answer)", width: 1.2 }, { values: signal.clean, color: "#d97706", width: 2.5, dashed: true }],
    durationMs: 35, yRange: rangeFor(signal.received, signal.clean), yLabel: "Amplitud",
    markers: [{ time: signal.directDelay, label: "Sonido directo", color: "var(--muted)" }, { time: signal.delay, label: "Eco real", labelY: 32 }],
  });
  document.querySelector("#sonar-correlation-plot").innerHTML = chartMarkup({
    curves: [{ values: correlation, color: "var(--wave)" }], durationMs: 35,
    yRange: rangeFor(correlation, [estimate.threshold]), yLabel: "C (normalizada)",
    searchRange: [estimate.minDelay * 1000, estimate.maxDelay * 1000], threshold: estimate.threshold,
    markers: [{ time: signal.directDelay, label: "Directo", color: "var(--muted)" }, { time: estimate.delay, label: estimate.detected ? `Eco detectado · ${formatNumber(estimate.delay * 1000)} ms` : "Pico insuficiente", value: estimate.peak, labelY: 32 }],
  });
  document.querySelector("#sonar-received-plot").setAttribute("aria-label", `Sonido directo a ${formatNumber(signal.directDelay * 1000)} ms y eco real a ${formatNumber(signal.delay * 1000)} ms, con ruido de desviación típica ${formatNumber(model.noise)}`);
  document.querySelector("#sonar-correlation-plot").setAttribute("aria-label", `Correlación con el chirp. ${estimate.detected ? `Eco detectado a ${formatNumber(estimate.delay * 1000)} milisegundos; distancia estimada ${formatNumber(estimate.distance)} metros` : "No se detecta un eco por encima del umbral"}`);
  document.querySelector("#sonar-status").textContent = estimate.detected ? "Eco detectado" : "Eco no concluyente";
  const rows = [
    ["Distancia real (altavoz → persona)", `${formatNumber(model.distance)} m`],
    ["Distancia estimada", estimate.detected ? `${formatNumber(estimate.distance)} m` : "—"],
    ["Error absoluto", estimate.detected ? `${formatNumber(Math.abs(estimate.distance - model.distance) * 100)} cm` : "—"],
    ["Retardo estimado del eco", estimate.detected ? `${formatNumber(estimate.delay * 1000)} ms` : "—"],
    ["Retardo real del eco", `${formatNumber(signal.delay * 1000)} ms`],
    ["Pico de correlación / umbral", `${formatNumber(estimate.peak)} / ${formatNumber(estimate.threshold)}`],
    ["Amplitud del eco sin ruido", formatNumber(signal.echoAmplitude)],
  ];
  document.querySelector("#sonar-readouts").innerHTML = rows.map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("");
  document.querySelector("#sonar-detection-note").textContent = estimate.detected
    ? "El máximo de correlación supera el umbral. La distancia se calcula a partir de ese retardo y de la separación del micrófono; el ruido puede desplazar el máximo o generar una falsa detección."
    : "El pico no supera el umbral de detección. El eco puede ser demasiado débil para este ruido: reduce σ, acerca la persona o aumenta su tamaño, y repite la medida.";
}

Object.values(fields).forEach(input => input.addEventListener("input", render));
document.querySelector("#sonar-emit").addEventListener("click", () => { baseNoise = randomNoise(baseNoise.length); render(); if (currentModel) animateEmission(); });
render();
