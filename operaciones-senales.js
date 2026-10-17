'use strict';

const operationsSignals = [
  { id: 'sine', name: 'Seno de 1 Hz', latex: String.raw`\sin(2\pi t)`, value: t => Math.sin(2 * Math.PI * t) },
  { id: 'cosine', name: 'Coseno de 1 Hz', latex: String.raw`\cos(2\pi t)`, value: t => Math.cos(2 * Math.PI * t) },
  { id: 'step', name: 'Escalón unitario', latex: 'u(t)', value: t => t < 0 ? 0 : 1 },
  { id: 'delayed-step', name: 'Escalón desplazado a 1 s', latex: 'u(t-1)', value: t => t < 1 ? 0 : 1 },
  { id: 'pulse', name: 'Pulso rectangular entre −1 y 1 s', latex: 'u(t+1)-u(t-1)', value: t => t >= -1 && t < 1 ? 1 : 0 },
  { id: 'triangle', name: 'Pulso triangular entre −1 y 1 s', latex: String.raw`\max(0,1-|t|)`, value: t => Math.max(0, 1 - Math.abs(t)) },
  { id: 'ramp', name: 'Rampa unitaria', latex: String.raw`t\,u(t)`, value: t => Math.max(0, t) },
  { id: 'exponential', name: 'Exponencial decreciente causal', latex: String.raw`e^{-t}u(t)`, value: t => t < 0 ? 0 : Math.exp(-t) },
  { id: 'constant', name: 'Constante de valor 1', latex: '1', value: () => 1 },
  { id: 'zero', name: 'Señal nula', latex: '0', value: () => 0 },
];
const operations = {
  add: { symbol: '+', name: 'Suma', apply: (a, b) => a + b },
  subtract: { symbol: '-', name: 'Diferencia', apply: (a, b) => a - b },
  multiply: { symbol: String.raw`\cdot`, name: 'Producto', apply: (a, b) => a * b },
};
const firstSelect = document.querySelector('#operations-first');
const secondSelect = document.querySelector('#operations-second');
const operationSelect = document.querySelector('#operations-operation');
const firstShift = document.querySelector('#operations-shift-first');
const secondShift = document.querySelector('#operations-shift-second');
for (const select of [firstSelect, secondSelect]) {
  for (const signal of operationsSignals) {
    const option = document.createElement('option');
    option.value = signal.id;
    option.textContent = signal.name;
    select.append(option);
  }
}
secondSelect.value = 'pulse';

const operationsFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });
const operationsShiftFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function operationsPlot(points, maximum, color, title, width, height) {
  const left = 55, right = width - 16, top = 26, bottom = height - 40;
  const x = t => left + (t + 3) / 6 * (right - left);
  const y = value => top + (1 - value / maximum) / 2 * (bottom - top);
  let svg = `<title>${title}</title>`;
  for (let tick = -3; tick <= 3; tick++) {
    svg += `<line class="${tick === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${x(tick)}" x2="${x(tick)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(tick)}" y="${bottom + 18}" text-anchor="middle">${tick}</text>`;
  }
  for (let tick = -2; tick <= 2; tick++) {
    const value = tick * maximum / 2;
    svg += `<line class="${tick === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}"/><text class="plot-tick-label" x="${left - 8}" y="${y(value) + 4}" text-anchor="end">${operationsFormat.format(value)}</text>`;
  }
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(point.t).toFixed(2)},${y(point.value).toFixed(2)}`).join(' ');
  return svg + `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" vector-effect="non-scaling-stroke"/><text class="plot-axis-label" x="${right}" y="${height - 3}" text-anchor="end">Tiempo (s)</text><text class="plot-axis-label" x="${left}" y="16">Amplitud (u.a.)</text>`;
}

let operationsTypeset = Promise.resolve();
function updateOperations() {
  const first = operationsSignals.find(signal => signal.id === firstSelect.value);
  const second = operationsSignals.find(signal => signal.id === secondSelect.value);
  const operation = operations[operationSelect.value];
  const shiftA = Number(firstShift.value), shiftB = Number(secondShift.value);
  for (const [key, shift] of [['first', shiftA], ['second', shiftB]]) {
    document.querySelector(`#operations-shift-${key}-value`).textContent = `${operationsShiftFormat.format(shift)} s`;
    document.querySelector(`#operations-shift-${key}`).setAttribute('aria-valuetext', `${operationsShiftFormat.format(shift)} segundos`);
  }
  const shiftedLatex = (signal, shift) => shift === 0 ? signal.latex
    : signal.latex.replace(/\bt\b/g, `(t${shift > 0 ? '-' : '+'}${Math.abs(shift).toFixed(1)})`);
  const times = Array.from({ length: 1201 }, (_, index) => -3 + index / 200);
  const a = times.map(t => ({ t, value: first.value(t - shiftA) }));
  const b = times.map(t => ({ t, value: second.value(t - shiftB) }));
  const result = times.map((t, index) => ({ t, value: operation.apply(a[index].value, b[index].value) }));
  const maximum = Math.max(1, Math.ceil(Math.max(...a.map(p => Math.abs(p.value)), ...b.map(p => Math.abs(p.value)), ...result.map(p => Math.abs(p.value))) * 1.1));
  for (const [id, points, color, title] of [
    ['first', a, 'var(--wave)', `Primera señal: ${first.name}, desplazamiento ${operationsShiftFormat.format(shiftA)} s`],
    ['second', b, '#7c3aed', `Segunda señal: ${second.name}, desplazamiento ${operationsShiftFormat.format(shiftB)} s`],
    ['result', result, 'var(--answer)', `${operation.name} de las señales`],
  ]) {
    const plot = document.querySelector(`#operations-plot-${id}`);
    const width = Math.max(240, plot.clientWidth);
    const height = Math.max(150, plot.clientHeight);
    plot.setAttribute('viewBox', `0 0 ${width} ${height}`);
    plot.innerHTML = operationsPlot(points, maximum, color, title, width, height);
    plot.setAttribute('aria-label', `${title}. Tiempo entre −3 y 3 segundos; amplitud entre −${maximum} y ${maximum} unidades arbitrarias.`);
  }
  document.querySelector('#operations-status').textContent = `${operation.name}: ${first.name.toLowerCase()} (${operationsShiftFormat.format(shiftA)} s) y ${second.name.toLowerCase()} (${operationsShiftFormat.format(shiftB)} s). Escala común: −${maximum} a ${maximum} u.a.`;
  const signalEquation = (signal, shift, index) => {
    if (signal.id === 'pulse') {
      const argument = offset => {
        const value = Number(offset.toFixed(10));
        return value === 0 ? 't' : `t${value > 0 ? '+' : '-'}${Math.abs(value).toFixed(1)}`;
      };
      return String.raw`\[x_${index}(t)=u(${argument(1 - shift)})-u(${argument(-1 - shift)})\]`;
    }
    return String.raw`\[x_${index}(t)=${shiftedLatex(signal, shift)}\]`;
  };
  const equations = [
    ['first', signalEquation(first, shiftA, 1)],
    ['second', signalEquation(second, shiftB, 2)],
    ['result', String.raw`\[y(t)=x_1(t) ${operation.symbol} x_2(t)\]`],
  ];
  operationsTypeset = operationsTypeset.catch(() => {}).then(async () => {
    if (window.MathJax?.startup?.promise) await window.MathJax.startup.promise;
    const hosts = equations.map(([id]) => document.querySelector(`#operations-equation-${id}`));
    window.MathJax?.typesetClear?.(hosts);
    hosts.forEach((host, index) => { host.textContent = equations[index][1]; });
    if (window.MathJax?.typesetPromise) await window.MathJax.typesetPromise(hosts);
    hosts.forEach(host => {
      host.style.fontSize = '';
      const formula = host.querySelector('mjx-container');
      if (!formula) return;
      const available = host.clientWidth - 2;
      const needed = Math.max(formula.scrollWidth, formula.getBoundingClientRect().width);
      if (needed > available && available > 0) {
        host.style.fontSize = `${parseFloat(getComputedStyle(host).fontSize) * available / needed}px`;
      }
    });
  });
}
for (const select of [firstSelect, secondSelect, operationSelect]) select.addEventListener('change', updateOperations);
for (const slider of [firstShift, secondShift]) slider.addEventListener('input', updateOperations);
updateOperations();

const operationsResize = new ResizeObserver(() => {
  window.cancelAnimationFrame(operationsResize.frame);
  operationsResize.frame = window.requestAnimationFrame(updateOperations);
});
for (const plot of document.querySelectorAll('.operations-row svg')) operationsResize.observe(plot);
