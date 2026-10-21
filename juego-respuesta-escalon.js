const orderSelect = document.querySelector("#step-game-order");
const plot = document.querySelector("#step-game-plot");
const form = document.querySelector("#step-game-form");
const feedback = document.querySelector("#step-game-feedback");
const inputError = document.querySelector("#step-game-error");
const solution = document.querySelector("#step-game-solution");
const fields = Object.fromEntries(["gain", "tau", "b0", "a1", "a0"].map(name => [name, document.querySelector(`#step-game-${name}`)]));
const numberFormat = new Intl.NumberFormat("es", { maximumFractionDigits: 4 });
const formatNumber = value => numberFormat.format(Math.abs(value) < 1e-12 ? 0 : value);
let history = [];
let challengeIndex = -1;
let solutionShown = false;
let plotInspection = null;
let inspectedTime = 0;
const cursorValues = document.querySelector("#step-game-cursor-values");

function randomValue(min, max, step) {
  return Number((min + Math.floor(Math.random() * (Math.round((max - min) / step) + 1)) * step).toFixed(4));
}

function generateChallenge(order) {
  const gain = randomValue(0.5, 2, 0.1);
  if (order === 1) {
    const tau = randomValue(0.2, 1.6, 0.1);
    return { order, gain, tau, duration: 6 * tau };
  }
  const regime = Math.floor(Math.random() * 3);
  const zeta = regime === 0 ? randomValue(0.2, 0.8, 0.05) : regime === 1 ? 1 : randomValue(1.2, 1.8, 0.1);
  const omega0 = randomValue(1, 5, 0.5);
  const slowRate = zeta > 1 ? omega0 / (zeta + Math.sqrt(zeta * zeta - 1)) : zeta * omega0;
  return { order, gain, zeta, omega0, b0: gain * omega0 ** 2, a1: 2 * zeta * omega0, a0: omega0 ** 2, duration: 8 / slowRate };
}

function response(model, time) {
  if (time <= 0) return 0;
  if (model.order === 1) return model.gain * -Math.expm1(-time / model.tau);
  const { gain, omega0, zeta } = model;
  const alpha = zeta * omega0;
  if (Math.abs(zeta - 1) < 1e-8) return gain * (1 - (1 + omega0 * time) * Math.exp(-omega0 * time));
  if (zeta < 1) {
    const wd = omega0 * Math.sqrt(1 - zeta * zeta);
    return gain * (1 - Math.exp(-alpha * time) * (Math.cos(wd * time) + alpha / wd * Math.sin(wd * time)));
  }
  const p2 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
  const p1 = omega0 * omega0 / p2;
  return gain * (1 + (p2 * Math.exp(p1 * time) - p1 * Math.exp(p2 * time)) / (p1 - p2));
}

function activeNames() {
  return orderSelect.value === "1" ? ["gain", "tau"] : ["b0", "a1", "a0"];
}

function readAnswer() {
  const values = {};
  let firstInvalid = null;
  for (const name of activeNames()) {
    const input = fields[name];
    const raw = input.value.trim();
    const value = Number(raw);
    const valid = raw !== "" && Number.isFinite(value) && value >= Number(input.min) && value <= Number(input.max);
    input.setAttribute("aria-invalid", String(!valid));
    if (!valid && !firstInvalid) firstInvalid = input;
    values[name] = value;
  }
  if (firstInvalid) {
    const label = firstInvalid.closest("label").childNodes[0].textContent.trim();
    const error = new Error(`${label}: introduce un número entre ${formatNumber(Number(firstInvalid.min))} y ${formatNumber(Number(firstInvalid.max))}.`);
    error.field = firstInvalid;
    throw error;
  }
  if (orderSelect.value === "1") return { order: 1, gain: values.gain, tau: values.tau };
  const omega0 = Math.sqrt(values.a0);
  return { order: 2, gain: values.b0 / values.a0, omega0, zeta: values.a1 / (2 * omega0), ...values };
}

function sampleResponse(model, duration) {
  // La malla temporal común mantiene comparables la puntuación y las curvas.
  return Array.from({ length: 1601 }, (_, i) => response(model, duration * i / 1600));
}

function scoreAnswer(target, answer) {
  const expected = sampleResponse(target, target.duration);
  const actual = sampleResponse(answer, target.duration);
  const errorPower = expected.reduce((sum, value, i) => sum + (value - actual[i]) ** 2, 0);
  const targetPower = expected.reduce((sum, value) => sum + value ** 2, 0);
  return Math.max(0, Math.min(100, 100 * (1 - Math.sqrt(errorPower / targetPower))));
}

function niceTicks(min, max, count = 6) {
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  const ticks = [];
  for (let i = Math.ceil(min / step); i * step <= max + step * 1e-9; i += 1) ticks.push(i * step);
  return ticks;
}

function renderPlot(answer = null) {
  const target = history[challengeIndex];
  const targetSamples = sampleResponse(target, target.duration);
  const answerSamples = answer ? sampleResponse(answer, target.duration) : [];
  const minimum = Math.min(0, ...targetSamples, ...answerSamples);
  const maximum = Math.max(1, ...targetSamples, ...answerSamples);
  const padding = (maximum - minimum) * 0.12;
  const yMin = minimum - padding;
  const yMax = maximum + padding;
  const bounds = plot.getBoundingClientRect();
  const width = bounds.height > 0 ? Math.max(320, 480 * bounds.width / bounds.height) : 800;
  const right = width - 24;
  plot.setAttribute("viewBox", `0 0 ${width} 480`);
  const x = time => 62 + time / target.duration * (right - 62);
  const y = value => 22 + (yMax - value) / (yMax - yMin) * 416;
  const parts = [];
  for (const tick of niceTicks(0, target.duration)) {
    parts.push(`<line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="22" x2="${x(tick)}" y2="438" /><text class="plot-tick-label" x="${x(tick)}" y="458" text-anchor="middle">${formatNumber(tick)}</text>`);
  }
  for (const tick of niceTicks(yMin, yMax)) {
    parts.push(`<line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="62" y1="${y(tick)}" x2="${right}" y2="${y(tick)}" /><text class="plot-tick-label" x="52" y="${y(tick) + 4}" text-anchor="end">${formatNumber(tick)}</text>`);
  }
  for (const [samples, color, dash] of [[targetSamples, "var(--answer)", ""], [answerSamples, "#d97706", 'stroke-dasharray="8 5"']]) {
    if (!samples.length) continue;
    const path = samples.map((value, i) => `${i ? "L" : "M"}${x(target.duration * i / 1600).toFixed(2)},${y(value).toFixed(2)}`).join(" ");
    parts.push(`<path d="${path}" fill="none" stroke="${color}" stroke-width="3" ${dash} vector-effect="non-scaling-stroke" />`);
  }
  parts.push(`<text class="plot-axis-label" x="${right}" y="478" text-anchor="end">t (s)</text><text class="plot-axis-label" x="14" y="22">y(t) (adimensional)</text>`);
  parts.push('<g id="step-game-cursor" visibility="hidden" pointer-events="none"><line id="step-game-cursor-line" y1="22" y2="438" stroke="var(--muted)" stroke-dasharray="4 4"/><circle id="step-game-target-dot" r="5" fill="var(--answer)" stroke="var(--surface)" stroke-width="2"/><circle id="step-game-answer-dot" r="5" fill="#d97706" stroke="var(--surface)" stroke-width="2"/></g>');
  plotInspection = { target, answer, x, y, right };
  inspectedTime = 0;
  cursorValues.textContent = 'Sitúa el cursor sobre la gráfica para consultar los valores.';
  plot.innerHTML = parts.join("");
  plot.setAttribute("aria-label", `Respuesta al escalón unitario de ${target.order === 1 ? "primer" : "segundo"} orden, entre 0 y ${formatNumber(target.duration)} segundos${answer ? ", comparada con tu respuesta discontinua" : ""}`);
}

function inspectPlot(time) {
  if (!plotInspection) return;
  const { target, answer, x, y } = plotInspection;
  inspectedTime = Math.max(0, Math.min(target.duration, time));
  const amplitude = response(target, inspectedTime);
  const cursorX = x(inspectedTime);
  document.querySelector('#step-game-cursor').setAttribute('visibility', 'visible');
  const line = document.querySelector('#step-game-cursor-line');
  line.setAttribute('x1', cursorX); line.setAttribute('x2', cursorX);
  const targetDot = document.querySelector('#step-game-target-dot');
  targetDot.setAttribute('cx', cursorX); targetDot.setAttribute('cy', y(amplitude));
  const answerDot = document.querySelector('#step-game-answer-dot');
  answerDot.setAttribute('visibility', answer ? 'visible' : 'hidden');
  let text = `t = ${formatNumber(inspectedTime)} s · Amplitud objetivo: ${formatNumber(amplitude)}`;
  if (answer) {
    const value = response(answer, inspectedTime);
    answerDot.setAttribute('cx', cursorX); answerDot.setAttribute('cy', y(value));
    text += ` · Amplitud de tu respuesta: ${formatNumber(value)}`;
  }
  cursorValues.textContent = `${text} (amplitudes adimensionales).`;
}
function inspectPointer(event) {
  const matrix = plot.getScreenCTM();
  if (!matrix || !plotInspection) return;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  if (point.x < 62 || point.x > plotInspection.right || point.y < 22 || point.y > 438) {
    document.querySelector('#step-game-cursor').setAttribute('visibility', 'hidden');
    return;
  }
  inspectPlot((point.x - 62) / (plotInspection.right - 62) * plotInspection.target.duration);
}
plot.addEventListener('pointermove', inspectPointer);
plot.addEventListener('pointerdown', inspectPointer);
plot.addEventListener('pointerleave', () => {
  document.querySelector('#step-game-cursor')?.setAttribute('visibility', 'hidden');
});
plot.addEventListener('focus', () => inspectPlot(inspectedTime));
plot.addEventListener('keydown', event => {
  if (!plotInspection || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const duration = plotInspection.target.duration;
  const step = duration / (event.shiftKey ? 20 : 200);
  inspectPlot(event.key === 'Home' ? 0 : event.key === 'End' ? duration : inspectedTime + (event.key === 'ArrowLeft' ? -step : step));
});

function evaluateAnswer(grade = false) {
  feedback.className = "game-feedback";
  try {
    const answer = readAnswer();
    inputError.hidden = true;
    renderPlot(answer);
    if (grade) {
      const score = scoreAnswer(history[challengeIndex], answer);
      feedback.classList.add(score >= 99.5 ? "is-success" : "is-error");
      feedback.textContent = `${solutionShown ? "Tras consultar la solución · " : ""}Coincidencia: ${formatNumber(score)} %. ${score >= 99.5 ? "¡Correcto! Tu modelo reproduce la respuesta." : "Compara el valor final y la forma de la curva; ajusta los coeficientes y vuelve a probar."}`;
    } else feedback.textContent = "Tu respuesta está dibujada. Pulsa «Comprobar» para obtener la coincidencia.";
  } catch (error) {
    renderPlot();
    const hasEntry = activeNames().some(name => fields[name].value !== "");
    inputError.hidden = !grade && !hasEntry;
    inputError.textContent = error.message;
    feedback.textContent = "Completa todas las casillas con valores válidos para visualizar tu respuesta.";
    if (grade) error.field?.focus();
  }
}

function loadChallenge() {
  for (const input of Object.values(fields)) {
    input.value = "";
    input.removeAttribute("aria-invalid");
  }
  solutionShown = false;
  inputError.hidden = true;
  solution.hidden = true;
  document.querySelector("#step-game-hint").hidden = true;
  document.querySelector("#step-game-hint-button").textContent = "Ver pista";
  document.querySelector("#step-game-first-model").hidden = orderSelect.value !== "1";
  document.querySelector("#step-game-second-model").hidden = orderSelect.value !== "2";
  document.querySelectorAll("[data-order-hint]").forEach(el => { el.hidden = el.dataset.orderHint !== orderSelect.value; });
  document.querySelectorAll("[data-order-formulas]").forEach(el => { el.hidden = el.dataset.orderFormulas !== orderSelect.value; });
  document.querySelector("#step-game-previous").disabled = challengeIndex === 0;
  document.querySelector("#step-game-progress").textContent = `Reto ${challengeIndex + 1}`;
  feedback.className = "game-feedback";
  feedback.textContent = "Completa H(s) para visualizar tu respuesta.";
  renderPlot();
}

function nextChallenge() {
  if (challengeIndex + 1 === history.length) history.push(generateChallenge(Number(orderSelect.value)));
  challengeIndex += 1;
  loadChallenge();
}

form.addEventListener("submit", event => { event.preventDefault(); evaluateAnswer(true); });
Object.values(fields).forEach(input => input.addEventListener("input", () => {
  solution.hidden = true;
  evaluateAnswer();
}));
orderSelect.addEventListener("change", () => { history = []; challengeIndex = -1; nextChallenge(); });
document.querySelector("#step-game-next").addEventListener("click", nextChallenge);
document.querySelector("#step-game-previous").addEventListener("click", () => {
  if (challengeIndex === 0) return;
  challengeIndex -= 1;
  loadChallenge();
});
document.querySelector("#step-game-hint-button").addEventListener("click", event => {
  const hint = document.querySelector("#step-game-hint");
  hint.hidden = !hint.hidden;
  event.currentTarget.textContent = hint.hidden ? "Ver pista" : "Ocultar pista";
});
document.querySelector("#step-game-solution-button").addEventListener("click", () => {
  const target = history[challengeIndex];
  for (const name of activeNames()) fields[name].value = Number(target[name].toFixed(8));
  solutionShown = true;
  evaluateAnswer();
  const latex = target.order === 1
    ? `\\(H(s)=\\dfrac{${target.gain}}{${target.tau}s+1}\\)`
    : `\\(H(s)=\\dfrac{${Number(target.b0.toFixed(8))}}{s^2+${Number(target.a1.toFixed(8))}s+${target.a0}}\\)`;
  if (window.MathJax?.typesetClear) window.MathJax.typesetClear([solution]);
  solution.textContent = `Solución: ${latex}`;
  solution.hidden = false;
  if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([solution]).catch(() => {});
  feedback.textContent = "Solución visible. Observa cómo reproduce la respuesta objetivo; pulsa «Siguiente reto» para practicar.";
});

nextChallenge();

let plotSize = "";
new ResizeObserver(() => {
  const bounds = plot.getBoundingClientRect();
  const size = `${bounds.width.toFixed(1)}:${bounds.height.toFixed(1)}`;
  if (size === plotSize) return;
  plotSize = size;
  const answer = plotInspection?.answer;
  renderPlot(answer);
}).observe(plot);
