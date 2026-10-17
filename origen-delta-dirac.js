'use strict';

const diracSlider = document.querySelector('#dirac-duration');
const diracSourcePlot = document.querySelector('#dirac-source-plot');
const diracResultPlot = document.querySelector('#dirac-result-plot');
const diracNumber = new Intl.NumberFormat('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const diracSource = (time, duration) => time < 0 ? 0 : duration === 0 ? 1 : Math.min(1, time / duration);
const diracDerivative = (time, duration) => duration === 0 ? null : time > 0 && time < duration ? 1 / duration : 0;

function diracCoordinates(plot, derivative) {
  const width = Math.max(240, plot.clientWidth), height = Math.max(210, plot.clientHeight);
  plot.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const left = 55, right = width - 18, top = 30, bottom = height - 42;
  const minimum = derivative ? -0.5 : -0.15, maximum = derivative ? 11 : 1.25;
  return {
    width, height, left, right, top, bottom,
    x: time => left + (time + 0.5) / 3 * (right - left),
    y: value => bottom - (value - minimum) / (maximum - minimum) * (bottom - top),
  };
}

function diracGrid(coords, derivative) {
  const { width, height, left, right, top, bottom, x, y } = coords;
  let svg = `<title>${derivative ? 'Derivada de la rampa' : 'Señal de origen'}</title>`;
  for (let index = -1; index <= 5; index++) {
    const time = index / 2;
    svg += `<line class="${time === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${x(time)}" x2="${x(time)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(time)}" y="${bottom + 18}" text-anchor="middle">${diracNumber.format(time)}</text>`;
  }
  for (const value of derivative ? [0, 2, 4, 6, 8, 10] : [0, 0.5, 1]) {
    svg += `<line class="${value === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}"/><text class="plot-tick-label" x="${left - 8}" y="${y(value) + 4}" text-anchor="end">${diracNumber.format(value)}</text>`;
  }
  return svg + `<text class="plot-axis-label" x="${left}" y="17">${derivative ? 'Derivada (u.a./s)' : 'Amplitud (u.a.)'}</text><text class="plot-axis-label" x="${width - 18}" y="${height - 3}" text-anchor="end">Tiempo (s)</text>`;
}

function diracPath(points, coords) {
  return points.map(([t, value], index) => `${index ? 'L' : 'M'}${coords.x(t).toFixed(2)},${coords.y(value).toFixed(2)}`).join(' ');
}

function diracDraw() {
  const duration = Number(diracSlider.value), ideal = duration === 0;
  const source = diracCoordinates(diracSourcePlot, false);
  const result = diracCoordinates(diracResultPlot, true);
  const sourcePoints = [[-0.5, 0], [0, 0], [duration, 1], [2.5, 1]];
  diracSourcePlot.innerHTML = diracGrid(source, false)
    + `<path class="dirac-source-line" d="${diracPath(sourcePoints, source)}" fill="none" stroke="var(--wave)" stroke-width="3" vector-effect="non-scaling-stroke"/>`
    + `<line class="calculus-cursor" x1="${source.x(duration)}" x2="${source.x(duration)}" y1="${source.top}" y2="${source.bottom}"/><circle class="calculus-current-point" cx="${source.x(duration)}" cy="${source.y(1)}" r="4.5"/>`;
  let svg = diracGrid(result, true);
  if (ideal) {
    svg += `<defs><marker id="dirac-ideal-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--answer)"/></marker></defs>`
      + `<path d="${diracPath([[-0.5, 0], [2.5, 0]], result)}" fill="none" stroke="var(--answer)" stroke-width="2.5"/>`
      + `<g class="dirac-ideal-impulse" role="img" aria-label="Delta de Dirac en cero, peso 1, altura simbólica"><line x1="${result.x(0)}" x2="${result.x(0)}" y1="${result.y(0)}" y2="${result.y(10)}" stroke="var(--answer)" stroke-width="3" marker-end="url(#dirac-ideal-arrow)"/><text class="plot-tick-label" x="${result.x(0) + 10}" y="${result.y(10) - 7}">Peso 1</text></g>`;
  } else {
    const height = 1 / duration;
    const pulse = [[-0.5, 0], [0, 0], [0, height], [duration, height], [duration, 0], [2.5, 0]];
    svg += `<path class="dirac-pulse-area" d="${diracPath([[0, 0], [0, height], [duration, height], [duration, 0]], result)}Z" fill="var(--answer)" fill-opacity="0.2"/>`
      + `<path class="dirac-pulse-line" d="${diracPath(pulse, result)}" fill="none" stroke="var(--answer)" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
  }
  diracResultPlot.innerHTML = svg;
  const timeText = diracNumber.format(duration);
  document.querySelector('#dirac-duration-value').textContent = `${timeText} s`;
  diracSlider.setAttribute('aria-valuetext', ideal ? '0,0 segundos: límite ideal, delta de Dirac' : `${timeText} segundos`);
  document.querySelector('#dirac-source-title').textContent = ideal ? 'Escalón: límite ideal' : 'Rampa de 0 a 1';
  document.querySelector('#dirac-result-title').textContent = ideal ? 'Delta de Dirac: peso 1' : 'Pulso de área 1';
  document.querySelector('#dirac-width').textContent = ideal ? 'Concentrada en t = 0' : `${timeText} s`;
  document.querySelector('#dirac-height').textContent = ideal ? 'Sin amplitud finita' : `${diracNumber.format(1 / duration)} u.a./s`;
  document.querySelector('#dirac-area-label').textContent = ideal ? 'Peso' : 'Área';
  document.querySelector('#dirac-area').textContent = '1,0 u.a.';
  document.querySelector('#dirac-status').textContent = ideal ? 'Límite ideal T → 0⁺: el escalón tiene como derivada una delta de peso 1.' : `La rampa alcanza 1 en ${timeText} s. Al reducir T, aumenta la altura 1/T y el área sigue siendo 1.`;
  document.querySelector('#dirac-result-note').textContent = ideal ? 'La flecha indica el peso 1. Su altura es simbólica y no se lee en la escala de amplitud.' : 'Área sombreada: anchura T × altura 1/T = 1. La escala vertical es fija de 0 a 10 u.a./s.';
  diracSourcePlot.setAttribute('aria-label', ideal ? 'Escalón unitario: cero antes de cero y uno desde cero.' : `Señal cero antes de cero; rampa lineal hasta uno en ${timeText} segundos; uno después.`);
  diracResultPlot.setAttribute('aria-label', ideal ? 'Delta de Dirac en cero, peso uno, sin amplitud finita. Flecha simbólica.' : `Pulso entre cero y ${timeText} segundos, altura ${diracNumber.format(1 / duration)} unidades arbitrarias por segundo y área uno. Escala vertical fija.`);
}

let diracEquationMode;
let diracTypeset = Promise.resolve();
function diracUpdate() {
  diracDraw();
  const ideal = Number(diracSlider.value) === 0;
  if (ideal === diracEquationMode) return;
  diracEquationMode = ideal;
  const equations = ideal ? [String.raw`\[x_0(t)=u(t)\]`, String.raw`\[x'_0(t)=\delta(t)\]\[\int_{-\infty}^{\infty}\delta(t)\,dt=1\]`]
    : [String.raw`\[x_T(t)=\begin{cases}0,&t<0\\t/T,&0\leq t<T\\1,&t\geq T\end{cases}\]`, String.raw`\[x'_T(t)=\frac{u(t)-u(t-T)}{T}\]\[T\cdot\frac{1}{T}=1\]`];
  diracTypeset = diracTypeset.catch(() => {}).then(async () => {
    if (window.MathJax?.startup?.promise) await window.MathJax.startup.promise;
    const hosts = [document.querySelector('#dirac-source-equation'), document.querySelector('#dirac-derivative-equation')];
    window.MathJax?.typesetClear?.(hosts);
    hosts.forEach((host, index) => { host.style.fontSize = ''; host.textContent = equations[index]; });
    if (window.MathJax?.typesetPromise) await window.MathJax.typesetPromise(hosts);
    hosts.forEach(host => {
      const needed = Math.max(0, ...[...host.querySelectorAll('mjx-container')].map(formula => Math.max(formula.scrollWidth, formula.getBoundingClientRect().width)));
      if (needed > host.clientWidth - 2 && host.clientWidth > 2) host.style.fontSize = `${parseFloat(getComputedStyle(host).fontSize) * (host.clientWidth - 2) / needed}px`;
    });
  });
}
diracSlider.addEventListener('input', diracUpdate);
diracUpdate();
let diracResizeFrame;
const diracResize = new ResizeObserver(() => {
  cancelAnimationFrame(diracResizeFrame);
  diracResizeFrame = requestAnimationFrame(diracDraw);
});
diracResize.observe(diracSourcePlot);
diracResize.observe(diracResultPlot);
