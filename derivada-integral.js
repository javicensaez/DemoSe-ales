'use strict';

const calculusStep = t => t < 0 ? 0 : 1;
const calculusRamp = t => Math.max(0, t);
const calculusOmega = 2 * Math.PI;
const calculusSignals = [
  {
    id: 'pulse', name: 'Pulso rectangular entre −1 y 1 s', start: -1,
    latex: 'u(t+1)-u(t-1)',
    value: t => calculusStep(t + 1) - calculusStep(t - 1),
    integral: t => calculusRamp(t + 1) - calculusRamp(t - 1),
    integralLatex: 'r(t+1)-r(t-1)', derivative: () => 0,
    derivativeLatex: String.raw`\delta(t+1)-\delta(t-1)`,
    impulses: [{ t: -1, weight: 1 }, { t: 1, weight: -1 }], corners: [],
  },
  {
    id: 'step', name: 'Escalón unitario', start: 0, latex: 'u(t)',
    value: calculusStep, integral: calculusRamp, integralLatex: 'r(t)',
    derivative: () => 0, derivativeLatex: String.raw`\delta(t)`,
    impulses: [{ t: 0, weight: 1 }], corners: [],
  },
  {
    id: 'delayed-step', name: 'Escalón desde 1 s', start: 1, latex: 'u(t-1)',
    value: t => calculusStep(t - 1), integral: t => calculusRamp(t - 1), integralLatex: 'r(t-1)',
    derivative: () => 0, derivativeLatex: String.raw`\delta(t-1)`,
    impulses: [{ t: 1, weight: 1 }], corners: [],
  },
  {
    id: 'triangle', name: 'Pulso triangular entre −1 y 1 s', start: -1,
    latex: String.raw`\max(0,1-|t|)`, value: t => Math.max(0, 1 - Math.abs(t)),
    integral: t => t <= -1 ? 0 : t <= 0 ? (t + 1) ** 2 / 2 : t < 1 ? 1 - (1 - t) ** 2 / 2 : 1,
    integralLatex: String.raw`\tfrac12 r^2(t+1)-r^2(t)+\tfrac12 r^2(t-1)`,
    derivative: t => t > -1 && t < 0 ? 1 : t > 0 && t < 1 ? -1 : 0,
    derivativeLatex: 'u(t+1)-2u(t)+u(t-1)', impulses: [], corners: [-1, 0, 1],
  },
  {
    id: 'ramp', name: 'Rampa unitaria', start: 0, latex: 'r(t)', value: calculusRamp,
    integral: t => calculusRamp(t) ** 2 / 2, integralLatex: String.raw`\tfrac12 r^2(t)`,
    derivative: calculusStep, derivativeLatex: 'u(t)', impulses: [], corners: [0],
  },
  {
    id: 'exponential', name: 'Exponencial decreciente causal', start: 0,
    latex: String.raw`e^{-t}u(t)`, value: t => t < 0 ? 0 : Math.exp(-t),
    integral: t => t < 0 ? 0 : -Math.expm1(-t), integralLatex: String.raw`(1-e^{-t})u(t)`,
    derivative: t => t < 0 ? 0 : -Math.exp(-t),
    derivativeLatex: String.raw`\delta(t)-e^{-t}u(t)`,
    impulses: [{ t: 0, weight: 1 }], corners: [],
  },
  {
    id: 'sine', name: 'Seno de 1 Hz desde t = 0', start: 0,
    latex: String.raw`\sin(2\pi t)u(t)`, value: t => t < 0 ? 0 : Math.sin(calculusOmega * t),
    integral: t => t < 0 ? 0 : (1 - Math.cos(calculusOmega * t)) / calculusOmega,
    integralLatex: String.raw`\frac{1-\cos(2\pi t)}{2\pi}u(t)`,
    derivative: t => t < 0 ? 0 : calculusOmega * Math.cos(calculusOmega * t),
    derivativeLatex: String.raw`2\pi\cos(2\pi t)u(t)`, impulses: [], corners: [0],
  },
  {
    id: 'cosine', name: 'Coseno de 1 Hz desde t = 0', start: 0,
    latex: String.raw`\cos(2\pi t)u(t)`, value: t => t < 0 ? 0 : Math.cos(calculusOmega * t),
    integral: t => t < 0 ? 0 : Math.sin(calculusOmega * t) / calculusOmega,
    integralLatex: String.raw`\frac{\sin(2\pi t)}{2\pi}u(t)`,
    derivative: t => t < 0 ? 0 : -calculusOmega * Math.sin(calculusOmega * t),
    derivativeLatex: String.raw`\delta(t)-2\pi\sin(2\pi t)u(t)`,
    impulses: [{ t: 0, weight: 1 }], corners: [],
  },
];

const calculusSignalSelect = document.querySelector('#calculus-signal');
const calculusOperationButtons = [...document.querySelectorAll('[data-calculus-operation]')];
let calculusOperation = 'integral';
const calculusTimeSlider = document.querySelector('#calculus-time');
const calculusSourcePlot = document.querySelector('#calculus-source-plot');
const calculusResultPlot = document.querySelector('#calculus-result-plot');
const calculusNumber = new Intl.NumberFormat('es', { maximumFractionDigits: 3 });
const calculusTimeNumber = new Intl.NumberFormat('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const calculusTimes = Array.from({ length: 1401 }, (_, index) => -3 + index / 200);
const calculusNear = (a, b) => Math.abs(a - b) < 1e-8;

for (const signal of calculusSignals) {
  const option = document.createElement('option');
  option.value = signal.id;
  option.textContent = signal.name;
  calculusSignalSelect.append(option);
}

function calculusCoordinates(plot, values) {
  const width = Math.max(240, plot.clientWidth), height = Math.max(210, plot.clientHeight);
  plot.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const maximum = Math.max(1, Math.ceil(Math.max(...values.filter(Number.isFinite).map(Math.abs)) * 1.15 * 2) / 2);
  const left = 58, right = width - 16, top = 30, bottom = height - 42;
  return {
    width, height, maximum, left, right, top, bottom,
    x: t => left + (t + 3) / 7 * (right - left),
    y: value => top + (1 - value / maximum) / 2 * (bottom - top),
  };
}

function calculusGrid(coords, unit, title) {
  const { width, height, maximum, left, right, top, bottom, x, y } = coords;
  let svg = `<title>${title}</title>`;
  for (let t = -3; t <= 4; t++) {
    svg += `<line class="${t === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${x(t)}" x2="${x(t)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(t)}" y="${bottom + 18}" text-anchor="middle">${t}</text>`;
  }
  for (let tick = -2; tick <= 2; tick++) {
    const v = tick * maximum / 2;
    svg += `<line class="${tick === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text class="plot-tick-label" x="${left - 8}" y="${y(v) + 4}" text-anchor="end">${calculusNumber.format(v)}</text>`;
  }
  return svg + `<text class="plot-axis-label" x="${left}" y="17">${unit}</text><text class="plot-axis-label" x="${width - 16}" y="${height - 3}" text-anchor="end">Tiempo (s)</text>`;
}

function calculusLine(points, coords, color) {
  let penDown = false;
  const path = points.map(({ t, value }) => {
    if (!Number.isFinite(value)) { penDown = false; return ''; }
    const command = penDown ? 'L' : 'M';
    penDown = true;
    return `${command}${coords.x(t).toFixed(2)},${coords.y(value).toFixed(2)}`;
  }).join(' ');
  return `<path class="calculus-signal-line" d="${path}" fill="none" stroke="${color}" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`;
}

function calculusArea(signal, time, coords) {
  if (time <= signal.start) return '';
  const count = Math.max(1, Math.ceil((time - signal.start) * 400));
  const points = Array.from({ length: count + 1 }, (_, index) => {
    const t = signal.start + (time - signal.start) * index / count;
    // El extremo derecho se toma por la izquierda en los saltos.
    return { t, value: signal.value(index === count ? t - 1e-10 : t) };
  });
  let svg = '<defs><pattern id="calculus-negative-area" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#d97706" fill-opacity="0.12"/><path d="M-1 1L1-1M0 7L7 0M6 8L8 6" stroke="#b45309" stroke-opacity="0.6"/></pattern></defs>';
  for (const positive of [true, false]) {
    const path = `M${coords.x(signal.start)},${coords.y(0)} ` + points.map(p => `L${coords.x(p.t).toFixed(2)},${coords.y(positive ? Math.max(0, p.value) : Math.min(0, p.value)).toFixed(2)}`).join(' ') + ` L${coords.x(time)},${coords.y(0)}Z`;
    svg += `<path class="calculus-area ${positive ? 'positive' : 'negative'}" d="${path}" fill="${positive ? 'var(--wave)' : 'url(#calculus-negative-area)'}"${positive ? ' fill-opacity="0.2"' : ''}/>`;
  }
  return svg;
}

function calculusCursor(coords, time, value) {
  const x = coords.x(time);
  return `<line class="calculus-cursor" x1="${x}" x2="${x}" y1="${coords.top}" y2="${coords.bottom}"/>` + (Number.isFinite(value) ? `<circle class="calculus-current-point" cx="${x}" cy="${coords.y(value)}" r="4.5"/>` : '');
}

function calculusDraw() {
  const signal = calculusSignals.find(item => item.id === calculusSignalSelect.value);
  const integral = calculusOperation === 'integral';
  const time = Number(calculusTimeSlider.value);
  const timeText = calculusTimeNumber.format(time);
  document.querySelector('#calculus-time-value').textContent = `${timeText} s`;
  calculusTimeSlider.setAttribute('aria-valuetext', `${timeText} segundos`);
  const source = calculusTimes.map(t => ({ t, value: signal.value(t) }));
  const events = [...signal.corners, ...signal.impulses.map(impulse => impulse.t)];
  const result = calculusTimes.flatMap(t => {
    if (integral) return [{ t, value: signal.integral(t) }];
    if (events.some(event => calculusNear(t, event))) {
      // Une los límites laterales para mostrar el contorno completo del pulso.
      // El segmento vertical no asigna un valor a la derivada en la esquina.
      return [{ t, value: signal.derivative(t - 1e-7) }, { t, value: signal.derivative(t + 1e-7) }];
    }
    return [{ t, value: signal.derivative(t) }];
  });
  const originalCoords = calculusCoordinates(calculusSourcePlot, source.map(p => p.value));
  const resultCoords = calculusCoordinates(calculusResultPlot, [...result.map(p => p.value), ...(!integral && signal.impulses.length ? [1] : [])]);
  calculusSourcePlot.innerHTML = calculusGrid(originalCoords, 'Amplitud (u.a.)', 'Señal original')
    + (integral ? calculusArea(signal, time, originalCoords) : '')
    + calculusLine(source, originalCoords, 'var(--wave)')
    + calculusCursor(originalCoords, time, signal.value(time));
  const selectedImpulse = signal.impulses.find(impulse => calculusNear(impulse.t, time));
  const corner = signal.corners.some(t => calculusNear(t, time));
  const current = integral ? signal.integral(time) : selectedImpulse || corner ? NaN : signal.derivative(time);
  let resultSvg = calculusGrid(resultCoords, integral ? 'Integral (u.a.·s)' : 'Derivada (u.a./s)', integral ? 'Integral acumulada' : 'Derivada de la señal')
    + calculusLine(result, resultCoords, 'var(--answer)')
    + calculusCursor(resultCoords, time, current);
  if (!integral && signal.impulses.length) {
    resultSvg += '<defs><marker id="calculus-impulse-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="var(--answer)"/></marker></defs>';
    for (const impulse of signal.impulses) {
      const x = resultCoords.x(impulse.t), tip = resultCoords.y(Math.sign(impulse.weight) * resultCoords.maximum * 0.7);
      resultSvg += `<g class="calculus-impulse" role="img" aria-label="Impulso en ${impulse.t} segundos, peso ${impulse.weight} unidades arbitrarias"><line x1="${x}" x2="${x}" y1="${resultCoords.y(0)}" y2="${tip}" stroke="var(--answer)" stroke-width="2.5" marker-end="url(#calculus-impulse-arrow)"/><text class="plot-tick-label" x="${x + 7}" y="${tip + (impulse.weight > 0 ? -7 : 16)}">Peso ${impulse.weight > 0 ? '+' : '−'}${calculusNumber.format(Math.abs(impulse.weight))}</text></g>`;
    }
  }
  calculusResultPlot.innerHTML = resultSvg;
  calculusSourcePlot.setAttribute('aria-label', `${signal.name}. Instante ${timeText} segundos.${integral ? ' Área sombreada desde −∞ hasta ese instante; las áreas negativas se restan.' : ''} Tiempo en segundos y amplitud en unidades arbitrarias.`);
  calculusResultPlot.setAttribute('aria-label', `${integral ? 'Integral acumulada' : 'Derivada'} de ${signal.name.toLowerCase()}, instante ${timeText} segundos.${!integral && signal.impulses.length ? ' Las flechas representan impulsos de Dirac con su peso, no amplitudes finitas.' : ''}`);
  const readout = document.querySelector('#calculus-readout');
  readout.textContent = integral
    ? `t = ${timeText} s · Área acumulada: ${calculusNumber.format(current)} u.a.·s.`
    : selectedImpulse ? `t = ${timeText} s · Hay un impulso de peso ${selectedImpulse.weight > 0 ? '+' : ''}${selectedImpulse.weight} u.a.; no tiene un valor de amplitud finito.`
    : corner ? `t = ${timeText} s · La derivada clásica no existe en esta esquina: las pendientes laterales son diferentes.`
    : `t = ${timeText} s · Pendiente: ${calculusNumber.format(current)} u.a./s.`;
}

let calculusTypeset = Promise.resolve();
let calculusFormulaVersion = 0;
function calculusUpdateMode() {
  const signal = calculusSignals.find(item => item.id === calculusSignalSelect.value);
  const integral = calculusOperation === 'integral';
  document.querySelector('#calculus-area-legend').hidden = !integral;
  document.querySelector('#calculus-result-title').textContent = integral ? 'Integral acumulada' : 'Derivada de la señal';
  document.querySelector('#calculus-time-help').textContent = integral ? 'Mueve t para ver el área acumulada y su valor en la gráfica del resultado.' : 'Mueve t para consultar la pendiente. En los saltos, la derivada se representa con impulsos.';
  document.querySelector('#calculus-signal-note').textContent = `La señal vale cero para t < ${signal.start} s. ${signal.id === 'sine' || signal.id === 'cosine' ? 'La oscilación empieza en t = 0; antes es nula.' : ''}`;
  document.querySelector('#calculus-result-note').textContent = integral
    ? 'La línea vertical y el punto marcan el área acumulada hasta t. La zona anterior al inicio de la señal aporta cero.'
    : signal.impulses.length ? 'Derivada generalizada: curva de la parte ordinaria y flechas para los impulsos. Cada flecha indica su peso; su altura es simbólica.'
    : 'La derivada es la pendiente de la señal original. Las líneas verticales unen los niveles en los saltos; en las esquinas de la señal original sigue sin existir una pendiente única.';
  const version = ++calculusFormulaVersion;
  const equations = [String.raw`\[x(t)=${signal.latex}\]`,
    integral ? String.raw`\[y(t)=\int_{-\infty}^{t}x(\tau)\,d\tau\]\[y(t)=${signal.integralLatex}\]`
      : String.raw`\[y(t)=\frac{dx(t)}{dt}\]\[y(t)=${signal.derivativeLatex}\]`];
  calculusTypeset = calculusTypeset.catch(() => {}).then(async () => {
    if (window.MathJax?.startup?.promise) await window.MathJax.startup.promise;
    if (version !== calculusFormulaVersion) return;
    const hosts = [document.querySelector('#calculus-source-equation'), document.querySelector('#calculus-result-equation')];
    window.MathJax?.typesetClear?.(hosts);
    hosts.forEach((host, index) => { host.style.fontSize = ''; host.textContent = equations[index]; });
    if (window.MathJax?.typesetPromise) await window.MathJax.typesetPromise(hosts);
    hosts.forEach(host => {
      const formulas = [...host.querySelectorAll('mjx-container')];
      const needed = Math.max(0, ...formulas.map(formula => Math.max(formula.scrollWidth, formula.getBoundingClientRect().width)));
      if (needed > host.clientWidth - 2 && host.clientWidth > 2) host.style.fontSize = `${parseFloat(getComputedStyle(host).fontSize) * (host.clientWidth - 2) / needed}px`;
    });
  });
  calculusDraw();
}
calculusSignalSelect.addEventListener('change', calculusUpdateMode);
for (const button of calculusOperationButtons) {
  button.addEventListener('click', () => {
    calculusOperation = button.dataset.calculusOperation;
    for (const option of calculusOperationButtons) {
      option.setAttribute('aria-pressed', String(option === button));
    }
    calculusUpdateMode();
  });
}
calculusTimeSlider.addEventListener('input', calculusDraw);
calculusUpdateMode();
let calculusResizeFrame;
const calculusResize = new ResizeObserver(() => {
  cancelAnimationFrame(calculusResizeFrame);
  calculusResizeFrame = requestAnimationFrame(calculusDraw);
});
calculusResize.observe(calculusSourcePlot);
calculusResize.observe(calculusResultPlot);
