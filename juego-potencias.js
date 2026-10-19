const challenges = [
  { title: 'Continua negativa', description: 'Una tensión constante de −4 V. También es periódica: usamos T = 1 ms.', equation: 'v(t)=-4\\,\\mathrm{V}', mean: -4, square: 16, resistance: 4, value: () => -4, steps: 'V_{\\mathrm{medio}}=-4\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=(-4)^2=16\\,\\mathrm{V}^2' },
  { title: 'Cuadrada simétrica', description: 'En cada periodo de 1 ms: +4 V durante la primera mitad y −4 V durante la segunda.', equation: 'v(t)=\\begin{cases}4\\,\\mathrm{V}&0\\le q<1/2\\\\-4\\,\\mathrm{V}&1/2\\le q<1\\end{cases}', mean: 0, square: 16, resistance: 8, value: q => q < .5 ? 4 : -4, steps: 'V_{\\mathrm{medio}}=\\frac{4-4}{2}=0\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=\\frac{4^2+(-4)^2}{2}=16\\,\\mathrm{V}^2' },
  { title: 'Rectangular con continua', description: 'En cada periodo de 1 ms: 5 V durante el 25 % del tiempo y 1 V durante el 75 % restante.', equation: 'v(t)=\\begin{cases}5\\,\\mathrm{V}&0\\le q<1/4\\\\1\\,\\mathrm{V}&1/4\\le q<1\\end{cases}', mean: 2, square: 7, resistance: 2, value: q => q < .25 ? 5 : 1, steps: 'V_{\\mathrm{medio}}=\\frac{5}{4}+\\frac{3}{4}=2\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=\\frac{25}{4}+\\frac{3}{4}=7\\,\\mathrm{V}^2' },
  { title: 'Senoidal con desplazamiento', description: 'Una cosenoide de amplitud 2 V con un desplazamiento de −3 V y periodo de 1 ms.', equation: 'v(t)=\\left[-3+2\\cos(2\\pi t/T)\\right]\\,\\mathrm{V}', mean: -3, square: 11, resistance: 10, value: q => -3 + 2 * Math.cos(2 * Math.PI * q), steps: 'V_{\\mathrm{medio}}=-3\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=(-3)^2+\\frac{2^2}{2}=11\\,\\mathrm{V}^2' },
  { title: 'Triangular entre 1 y 5 V', description: 'La tensión sube linealmente de 1 a 5 V en medio periodo y baja hasta 1 V en la otra mitad. T = 1 ms.', equation: 'v(t)=\\begin{cases}(1+8q)\\,\\mathrm{V}&0\\le q<1/2\\\\(9-8q)\\,\\mathrm{V}&1/2\\le q<1\\end{cases}', mean: 3, square: 31 / 3, resistance: 5, value: q => q < .5 ? 1 + 8 * q : 9 - 8 * q, steps: 'V_{\\mathrm{medio}}=\\frac{1+5}{2}=3\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=3^2+\\frac{(5-1)^2}{12}=\\frac{31}{3}\\,\\mathrm{V}^2' },
  { title: 'Rampa de −2 a 4 V', description: 'En cada periodo de 1 ms la tensión sube linealmente de −2 a 4 V y vuelve instantáneamente a −2 V.', equation: 'v(t)=(-2+6q)\\,\\mathrm{V}', mean: 1, square: 4, resistance: 2, value: q => -2 + 6 * q, steps: 'V_{\\mathrm{medio}}=\\frac{-2+4}{2}=1\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=\\frac{(-2)^2+(-2)(4)+4^2}{3}=4\\,\\mathrm{V}^2' },
  {
    title: 'V(d) · Triangular bipolar',
    description: 'Señal V(d) de la imagen: parte de −1 V, alcanza +1 V a los 0,5 ms y vuelve a −1 V a 1 ms. T = 1 ms.',
    equation: 'v_d(t)=\\begin{cases}(-1+4q)\\,\\mathrm{V}&0\\le q<1/2\\\\(3-4q)\\,\\mathrm{V}&1/2\\le q<1\\end{cases}',
    mean: 0, square: 1 / 3, resistance: 1, period: 1,
    plotMin: -1, plotMax: 1,
    value: q => q < .5 ? -1 + 4 * q : 3 - 4 * q,
    steps: 'V_{\\mathrm{medio}}=0\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=\\frac{1}{3}\\,\\mathrm{V}^2',
  },
  {
    title: 'V(e) · Pulsos triangulares positivos',
    description: 'Señal V(e) de la imagen: 0 V hasta 0,25 ms, subida lineal hasta 1 V a 0,5 ms, bajada hasta 0 V a 0,75 ms y 0 V hasta 1 ms. T = 1 ms.',
    equation: 'v_e(t)=\\begin{cases}0\\,\\mathrm{V}&0\\le q<1/4\\\\(4q-1)\\,\\mathrm{V}&1/4\\le q<1/2\\\\(3-4q)\\,\\mathrm{V}&1/2\\le q<3/4\\\\0\\,\\mathrm{V}&3/4\\le q<1\\end{cases}',
    mean: 1 / 4, square: 1 / 6, resistance: 1, period: 1,
    plotMin: -1, plotMax: 1,
    value: q => q < .25 || q >= .75 ? 0 : q < .5 ? 4 * q - 1 : 3 - 4 * q,
    steps: 'V_{\\mathrm{medio}}=\\frac{1}{2}\\cdot\\frac{1}{2}\\cdot 1=\\frac{1}{4}\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=\\frac{1}{2}\\cdot\\frac{1^2}{3}=\\frac{1}{6}\\,\\mathrm{V}^2',
  },
  {
    title: 'V(f) · Triangular positiva',
    description: 'Señal V(f) de la imagen: baja linealmente de 1 V a 0 V en 0,25 ms y sube a 1 V a 0,5 ms. T = 0,5 ms; se muestran cuatro periodos.',
    equation: 'v_f(t)=\\begin{cases}(1-2q)\\,\\mathrm{V}&0\\le q<1/2\\\\(2q-1)\\,\\mathrm{V}&1/2\\le q<1\\end{cases}',
    mean: 1 / 2, square: 1 / 3, resistance: 1, period: .5,
    plotMin: -1, plotMax: 1,
    value: q => q < .5 ? 1 - 2 * q : 2 * q - 1,
    steps: 'V_{\\mathrm{medio}}=\\frac{0+1}{2}=\\frac{1}{2}\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=\\frac{0^2+0\\cdot1+1^2}{3}=\\frac{1}{3}\\,\\mathrm{V}^2',
  },

  {
    title: 'Rampa con mesetas de 2 y −1 V',
    description: 'Señal de la imagen, interpretando el tiempo en ms y la tensión en V: 2 V de 0 a 1 ms, −1 V de 1 a 2 ms y una rampa de 0 a 2 V de 2 a 4 ms. Se repite con T = 4 ms.',
    equation: 'v(t)=\\begin{cases}2\\,\\mathrm{V}&0\\le q<1/4\\\\-1\\,\\mathrm{V}&1/4\\le q<1/2\\\\(4q-2)\\,\\mathrm{V}&1/2\\le q<1\\end{cases}',
    mean: 3 / 4, square: 23 / 12, resistance: 1, period: 4, duration: 8,
    plotMin: -2, plotMax: 3,
    plotPoints: [[0, 2], [1, 2], [1, -1], [2, -1], [2, 0], [4, 2], [5, 2], [5, -1], [6, -1], [6, 0], [8, 2]],
    value: q => q < .25 ? 2 : q < .5 ? -1 : 4 * q - 2,
    steps: 'V_{\\mathrm{medio}}=\\frac{2\\cdot1-1\\cdot1+\\frac{1}{2}\\cdot2\\cdot2}{4}=\\frac{3}{4}\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=\\frac{2^2\\cdot1+(-1)^2\\cdot1+\\int_0^2 u^2\\,du}{4}=\\frac{23}{12}\\,\\mathrm{V}^2',
  },
];
const metrics = [ ['mean', 'Valor medio / componente DC', 'V'], ['power', 'Potencia media', 'W'], ['rms', 'RMS total', 'V'], ['dc', 'RMS de continua (DC)', 'V'], ['ac', 'RMS de alterna (AC)', 'V'] ];
const states = challenges.map(() => ({ answers: {}, solved: false, revealed: false, checked: false }));
let current = 0;
const $ = selector => document.querySelector(selector);
const format = n => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 4 }).format(n);
function results(c) { return { mean: c.mean, power: c.square / c.resistance, rms: Math.sqrt(c.square), dc: Math.abs(c.mean), ac: Math.sqrt(Math.max(0, c.square - c.mean ** 2)) }; }
function typeset(element, content) {
  if (window.MathJax?.typesetClear) window.MathJax.typesetClear([element]);
  element.textContent = content;
  if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([element]).catch(() => {});
}
function draw(c) {
  const period = c.period ?? 1;
  const duration = c.duration ?? 2;
  const values = Array.from({length: 801}, (_, i) => c.value(((i / 800) * duration / period) % 1));
  const low = c.plotMin ?? Math.floor(Math.min(0, ...values)) - 1;
  const high = c.plotMax ?? Math.ceil(Math.max(0, ...values)) + 1;
  const x = t => 65 + t / duration * 705;
  const y = v => 30 + (high - v) / (high - low) * 270;
  let svg = `<title>${duration / period} periodos de la tensión del reto, T = ${format(period)} ms</title>`;
  for (let v = low; v <= high; v++) svg += `<line class="${v === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="65" x2="770" y1="${y(v)}" y2="${y(v)}"/><text class="plot-tick-label" x="52" y="${y(v)+4}" text-anchor="end">${v}</text>`;
  for (let t = 0; t <= duration; t += duration / 8) svg += `<line class="${t === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${x(t)}" x2="${x(t)}" y1="30" y2="300"/><text class="plot-tick-label" x="${x(t)}" y="325" text-anchor="middle">${format(t)}</text>`;
  const points = c.plotPoints ?? values.map((v, i) => [i / 800 * duration, v]);
  svg += `<path d="${points.map(([t, v], i) => `${i ? 'L' : 'M'}${x(t)},${y(v)}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3"/><text class="plot-axis-label" x="65" y="18">Tensión (V)</text><text class="plot-axis-label" x="770" y="350" text-anchor="end">Tiempo (ms)</text>`;
  $('#game-plot').innerHTML = svg;
  $('#game-plot').setAttribute('aria-label', `${c.title}. ${c.description} Eje temporal de 0 a ${format(duration)} ms; tensión en voltios.`);
}
function render() {
  const c = challenges[current], state = states[current];
  $('#challenge-progress').textContent = `Reto ${current + 1} de ${challenges.length}`;
  $('#previous-challenge').disabled = current === 0;
  $('#next-challenge').disabled = current === challenges.length - 1;
  $('#game-score').textContent = `${states.filter(s => s.solved).length} de ${challenges.length} retos resueltos sin revelar la solución`;
  $('#challenge-title').textContent = c.title;
  $('#challenge-description').textContent = c.description;
  $('#load-description').textContent = `Resistencia de carga: R = ${c.resistance} Ω.`;
  typeset($('#challenge-equation'), `\\[${c.equation}\\] En las señales por tramos, \\(q=(t\\bmod T)/T\\).`);
  $('#answer-fields').innerHTML = metrics.map(([key,label,unit]) => `<div><label for="answer-${key}">${label} (${unit})</label><input id="answer-${key}" data-metric="${key}" type="text" inputmode="decimal" autocomplete="off" aria-describedby="feedback-${key}"/><small id="feedback-${key}"></small></div>`).join('');
  metrics.forEach(([key]) => { $(`#answer-${key}`).value = state.answers[key] ?? ''; });
  $('#game-feedback').textContent = '';
  $('#next-correct-challenge').hidden = true;
  $('#game-solution').hidden = !state.revealed;
  $('#show-solution').setAttribute('aria-expanded', String(state.revealed));
  $('#show-solution').disabled = state.revealed;
  if (state.revealed) showSolution();
  if (state.checked) check();
  draw(c);
}
function check() {
  const expected = results(challenges[current]), state = states[current];
  let correct = 0, invalid = 0;
  metrics.forEach(([key]) => {
    const input = $(`#answer-${key}`), raw = input.value.trim();
    const valid = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(raw) && Number.isFinite(Number(raw.replace(',', '.')));
    const ok = valid && Math.abs(Number(raw.replace(',', '.')) - expected[key]) <= Math.max(.01, Math.abs(expected[key]) * .01);
    if (ok) correct++;
    if (!valid) invalid++;
    input.setAttribute('aria-invalid', String(!ok));
    $(`#feedback-${key}`).textContent = !valid ? 'Introduce un número decimal finito, sin unidades.' : ok ? '✓ Correcto' : 'Revisa este cálculo y sus unidades.';
  });
  state.checked = true;
  $('#next-correct-challenge').hidden = correct !== metrics.length || current === challenges.length - 1;
  if (correct === metrics.length && !state.revealed) state.solved = true;
  $('#game-feedback').textContent = correct === metrics.length ? (state.revealed ? 'Todos los valores coinciden. Has consultado la solución de este reto.' : '¡Reto resuelto! Todos los cálculos son correctos.') : `${correct} de ${metrics.length} valores correctos.${invalid ? ' Completa o corrige los campos indicados.' : ' Puedes volver a intentarlo.'}`;
  $('#game-score').textContent = `${states.filter(s => s.solved).length} de ${challenges.length} retos resueltos sin revelar la solución`;
}
function showSolution() {
  const c = challenges[current], r = results(c);
  const tex = n => String(Number(n.toFixed(4)));
  typeset($('#solution-content'), `\\[${c.steps}\\] \\[\\overline P=\\frac{\\langle v^2\\rangle}{R}\\approx ${tex(r.power)}\\,\\mathrm{W}\\] \\[V_{\\mathrm{RMS}}=\\sqrt{\\langle v^2\\rangle}\\approx ${tex(r.rms)}\\,\\mathrm{V}\\] \\[V_{\\mathrm{RMS,DC}}=|${tex(c.mean)}|=${tex(r.dc)}\\,\\mathrm{V}\\] \\[V_{\\mathrm{RMS,AC}}=\\sqrt{\\langle v^2\\rangle-(${tex(c.mean)})^2}\\approx ${tex(r.ac)}\\,\\mathrm{V}\\]`);
}
$('#answer-form').addEventListener('input', event => {
  const key = event.target.dataset.metric;
  if (!key) return;
  states[current].answers[key] = event.target.value;
  states[current].checked = false;
  $('#next-correct-challenge').hidden = true;
  event.target.removeAttribute('aria-invalid');
  $(`#feedback-${key}`).textContent = '';
  $('#game-feedback').textContent = 'Respuesta modificada. Pulsa Comprobar para evaluarla.';
});
$('#answer-form').addEventListener('submit', event => { event.preventDefault(); check(); });
$('#previous-challenge').addEventListener('click', () => { if (current > 0) { current--; render(); } });
$('#next-challenge').addEventListener('click', () => { if (current < challenges.length - 1) { current++; render(); } });
$('#next-correct-challenge').addEventListener('click', () => {
  if (current < challenges.length - 1) {
    current++;
    render();
    $('#challenge-title').setAttribute('tabindex', '-1');
    $('#challenge-title').focus();
  }
});
$('#show-solution').addEventListener('click', () => {
  states[current].revealed = true;
  $('#game-solution').hidden = false;
  $('#show-solution').setAttribute('aria-expanded', 'true');
  $('#show-solution').disabled = true;
  $('#game-feedback').textContent = 'Solución visible. Puedes seguir practicando; este reto solo puntúa si ya lo habías resuelto.';
  showSolution();
});
render();
