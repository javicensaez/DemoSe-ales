const challenges = [
  { title: 'Continua negativa', description: 'Una tensión constante de −4 V. También es periódica: usamos T = 1 ms.', equation: 'v(t)=-4\\,\\mathrm{V}', mean: -4, square: 16, resistance: 4, value: () => -4, steps: 'V_{\\mathrm{medio}}=-4\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=(-4)^2=16\\,\\mathrm{V}^2' },
  { title: 'Cuadrada simétrica', description: 'En cada periodo de 1 ms: +4 V durante la primera mitad y −4 V durante la segunda.', equation: 'v(t)=\\begin{cases}4\\,\\mathrm{V}&0\\le q<1/2\\\\-4\\,\\mathrm{V}&1/2\\le q<1\\end{cases}', mean: 0, square: 16, resistance: 8, value: q => q < .5 ? 4 : -4, steps: 'V_{\\mathrm{medio}}=\\frac{4-4}{2}=0\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=\\frac{4^2+(-4)^2}{2}=16\\,\\mathrm{V}^2' },
  { title: 'Rectangular con continua', description: 'En cada periodo de 1 ms: 5 V durante el 25 % del tiempo y 1 V durante el 75 % restante.', equation: 'v(t)=\\begin{cases}5\\,\\mathrm{V}&0\\le q<1/4\\\\1\\,\\mathrm{V}&1/4\\le q<1\\end{cases}', mean: 2, square: 7, resistance: 2, value: q => q < .25 ? 5 : 1, steps: 'V_{\\mathrm{medio}}=\\frac{5}{4}+\\frac{3}{4}=2\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=\\frac{25}{4}+\\frac{3}{4}=7\\,\\mathrm{V}^2' },
  { title: 'Senoidal con desplazamiento', description: 'Una cosenoide de amplitud 2 V con un desplazamiento de −3 V y periodo de 1 ms.', equation: 'v(t)=\\left[-3+2\\cos(2\\pi t/T)\\right]\\,\\mathrm{V}', mean: -3, square: 11, resistance: 10, value: q => -3 + 2 * Math.cos(2 * Math.PI * q), steps: 'V_{\\mathrm{medio}}=-3\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=(-3)^2+\\frac{2^2}{2}=11\\,\\mathrm{V}^2' },
  { title: 'Triangular entre 1 y 5 V', description: 'La tensión sube linealmente de 1 a 5 V en medio periodo y baja hasta 1 V en la otra mitad. T = 1 ms.', equation: 'v(t)=\\begin{cases}(1+8q)\\,\\mathrm{V}&0\\le q<1/2\\\\(9-8q)\\,\\mathrm{V}&1/2\\le q<1\\end{cases}', mean: 3, square: 31 / 3, resistance: 5, value: q => q < .5 ? 1 + 8 * q : 9 - 8 * q, steps: 'V_{\\mathrm{medio}}=\\frac{1+5}{2}=3\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=3^2+\\frac{(5-1)^2}{12}=\\frac{31}{3}\\,\\mathrm{V}^2' },
  { title: 'Rampa de −2 a 4 V', description: 'En cada periodo de 1 ms la tensión sube linealmente de −2 a 4 V y vuelve instantáneamente a −2 V.', equation: 'v(t)=(-2+6q)\\,\\mathrm{V}', mean: 1, square: 4, resistance: 2, value: q => -2 + 6 * q, steps: 'V_{\\mathrm{medio}}=\\frac{-2+4}{2}=1\\,\\mathrm{V},\\qquad \\langle v^2\\rangle=\\frac{(-2)^2+(-2)(4)+4^2}{3}=4\\,\\mathrm{V}^2' },
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
  const values = Array.from({length: 801}, (_, i) => c.value((i / 400) % 1));
  const low = Math.floor(Math.min(0, ...values)) - 1;
  const high = Math.ceil(Math.max(0, ...values)) + 1;
  const x = t => 65 + t / 2 * 705;
  const y = v => 30 + (high - v) / (high - low) * 270;
  let svg = '<title>Dos periodos de la tensión del reto</title>';
  for (let v = low; v <= high; v++) svg += `<line class="${v === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="65" x2="770" y1="${y(v)}" y2="${y(v)}"/><text class="plot-tick-label" x="52" y="${y(v)+4}" text-anchor="end">${v}</text>`;
  for (let t = 0; t <= 2; t += .5) svg += `<line class="${t === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${x(t)}" x2="${x(t)}" y1="30" y2="300"/><text class="plot-tick-label" x="${x(t)}" y="325" text-anchor="middle">${format(t)}</text>`;
  svg += `<path d="${values.map((v,i) => `${i ? 'L' : 'M'}${x(i/400)},${y(v)}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3"/><text class="plot-axis-label" x="65" y="18">Tensión (V)</text><text class="plot-axis-label" x="770" y="350" text-anchor="end">Tiempo (ms)</text>`;
  $('#game-plot').innerHTML = svg;
  $('#game-plot').setAttribute('aria-label', `${c.title}. ${c.description}`);
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
