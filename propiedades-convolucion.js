'use strict';

const cpStep = 0.02;
const cpDefinitions = [
  { id: 'rectangle', name: 'Pulso rectangular (anchura 1 s)', formula: String.raw`\operatorname{rect}(t)`, value: t => Math.abs(t) < 0.5 - 1e-9 ? 1 : Math.abs(Math.abs(t) - 0.5) < 1e-9 ? 0.5 : 0 },
  { id: 'triangle', name: 'Pulso triangular (base 2 s)', formula: String.raw`\max(0,1-|t|)`, value: t => Math.max(0, 1 - Math.abs(t)) },
  { id: 'bell', name: 'Pulso de coseno elevado (base 2 s)', formula: String.raw`\tfrac12[1+\cos(\pi t)]\; (|t|<1)`, value: t => Math.abs(t) < 1 ? 0.5 * (1 + Math.cos(Math.PI * t)) : 0 },
  { id: 'negative-triangle', name: 'Pulso triangular negativo', formula: String.raw`-\max(0,1-|t|)`, value: t => -Math.max(0, 1 - Math.abs(t)) },
];
const cpProperties = {
  commutative: { title: 'Conmutativa', latex: String.raw`\[x(t)*h(t)=h(t)*x(t)\]`, explanation: 'Intercambiar el orden de las dos señales no cambia la convolución.', recipe: 'Se calculan las dos convoluciones por separado, con las entradas en orden inverso.' },
  associative: { title: 'Asociativa', latex: String.raw`\[x*(h_1*h_2)=(x*h_1)*h_2\]`, explanation: 'Al convolucionar tres señales puedes elegir qué pareja calcular primero. El resultado final es el mismo.', recipe: 'Primer miembro: calcula h₁ * h₂ y después convoluciona con x. Segundo miembro: calcula x * h₁ y después convoluciona con h₂.' },
  distributive: { title: 'Distributiva', latex: String.raw`\[x*(h_1+h_2)=(x*h_1)+(x*h_2)\]`, explanation: 'Convolucionar con una suma equivale a convolucionar con cada sumando y sumar los resultados.', recipe: 'Primer miembro: suma h₁ y h₂ antes de convolucionar. Segundo miembro: calcula ambas convoluciones y suma sus salidas.' },
  identity: { title: 'Convolución con δ(t)', latex: String.raw`\[x(t)*\delta(t)=x(t)\]`, explanation: 'La delta de peso 1 actúa como identidad de la convolución: conserva la señal.', recipe: 'En la integral, δ(t − τ) selecciona la contribución de τ = t. Se compara el resultado con x(t).' },
  'impulse-shift': { title: 'Convolución con δ(t − t₀)', latex: String.raw`\[x(t)*\delta(t-t_0)=x(t-t_0)\]`, explanation: 'Una delta desplazada retrasa o adelanta la señal conservando su forma y su amplitud.', recipe: 'Mueve t₀. Si es positivo, el resultado se desplaza a la derecha; si es negativo, a la izquierda.' },
  'time-shift': { title: 'Desplazamiento temporal', latex: String.raw`\[x(t-a)*h(t-b)=(x*h)(t-a-b)\]`, explanation: 'Los retardos de las entradas se suman: desplazar x en a y h en b desplaza la convolución en a + b.', recipe: 'Primer miembro: desplaza cada entrada antes de convolucionar. Segundo miembro: calcula la convolución original y desplázala en a + b.' },
  derivative: { title: 'Derivación', latex: String.raw`\[\frac{d}{dt}(x*h)=x'*h=x*h'\]`, explanation: 'La derivada de una convolución se puede obtener derivando cualquiera de sus dos entradas.', recipe: 'Se comparan tres curvas: la derivada del resultado, x′ * h y x * h′. Para el pulso rectangular se incluyen sus dos impulsos de borde.' },
};

function cpSample(definition) {
  return { start: -1, values: Array.from({ length: 101 }, (_, index) => definition.value(-1 + index * cpStep)) };
}
function cpValue(series, time) {
  const index = (time - series.start) / cpStep;
  if (index < -1e-8 || index > series.values.length - 1 + 1e-8) return 0;
  const clamped = Math.max(0, Math.min(series.values.length - 1, index));
  const left = Math.floor(clamped), fraction = clamped - left;
  return series.values[left] * (1 - fraction) + (series.values[left + 1] ?? 0) * fraction;
}
function cpConvolve(a, b) {
  const values = new Float64Array(a.values.length + b.values.length - 1);
  for (let i = 0; i < a.values.length; i++) {
    if (a.values[i] === 0) continue;
    for (let j = 0; j < b.values.length; j++) values[i + j] += a.values[i] * b.values[j] * cpStep;
  }
  return { start: a.start + b.start, values };
}
const cpShift = (series, delay) => ({ start: series.start + delay, values: series.values });
function cpAdd(a, b, sign = 1) {
  const start = Math.min(a.start, b.start);
  const end = Math.max(a.start + (a.values.length - 1) * cpStep, b.start + (b.values.length - 1) * cpStep);
  return { start, values: Array.from({ length: Math.round((end - start) / cpStep) + 1 }, (_, index) => cpValue(a, start + index * cpStep) + sign * cpValue(b, start + index * cpStep)) };
}
function cpContinuousConvolution(a, b, time) {
  const radiusA = a.id === 'rectangle' ? 0.5 : 1;
  const radiusB = b.id === 'rectangle' ? 0.5 : 1;
  const left = Math.max(-radiusA, time - radiusB), right = Math.min(radiusA, time + radiusB);
  if (right <= left) return 0;
  // Separa las esquinas antes de integrar. Los extremos se evalúan desde el interior.
  const cuts = [left, ...[0, time].filter(t => t > left && t < right), right].sort((x, y) => x - y);
  let integral = 0;
  for (let part = 1; part < cuts.length; part++) {
    const start = cuts[part - 1], end = cuts[part];
    if (end <= start) continue;
    const count = 64, step = (end - start) / count;
    const value = t => a.value(t) * b.value(time - t);
    let sum = value(start + 1e-8) + value(end - 1e-8);
    for (let index = 1; index < count; index++) sum += (index % 2 ? 4 : 2) * value(start + index * step);
    integral += sum * step / 3;
  }
  return integral;
}
function cpDerivativeOfConvolution(a, b) {
  const epsilon = 0.0001;
  return { start: -2, values: Array.from({ length: 201 }, (_, index) => {
    const t = -2 + index * cpStep;
    return (cpContinuousConvolution(a, b, t + epsilon) - cpContinuousConvolution(a, b, t - epsilon)) / (2 * epsilon);
  }) };
}
function cpConvolveDerivative(definition, other) {
  if (definition.id === 'rectangle') {
    // d rect(t)/dt = δ(t + 1/2) − δ(t − 1/2).
    return cpAdd(cpShift(other, -0.5), cpShift(other, 0.5), -1);
  }
  const derivative = t => {
    if (definition.id === 'bell') return Math.abs(t) < 1 ? -Math.PI / 2 * Math.sin(Math.PI * t) : 0;
    const sign = definition.id === 'negative-triangle' ? -1 : 1;
    if (Math.abs(t + 1) < 1e-8) return sign * 0.5;
    if (Math.abs(t - 1) < 1e-8) return -sign * 0.5;
    if (Math.abs(t) < 1e-8) return 0;
    return t > -1 && t < 0 ? sign : t > 0 && t < 1 ? -sign : 0;
  };
  return cpConvolve(cpSample({ value: derivative }), other);
}

const cpSelectX = document.querySelector('#cp-x');
const cpSelectH1 = document.querySelector('#cp-h1');
const cpSelectH2 = document.querySelector('#cp-h2');
const cpImpulseSlider = document.querySelector('#cp-impulse-shift');
const cpShiftA = document.querySelector('#cp-shift-a');
const cpShiftB = document.querySelector('#cp-shift-b');
const cpButtons = [...document.querySelectorAll('[data-cp-property]')];
const cpTimeFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const cpNumber = new Intl.NumberFormat('es', { maximumFractionDigits: 4 });
let cpProperty = 'commutative';
for (const select of [cpSelectX, cpSelectH1, cpSelectH2]) {
  for (const definition of cpDefinitions) {
    const option = document.createElement('option');
    option.value = definition.id;
    option.textContent = definition.name;
    select.append(option);
  }
}
cpSelectH1.value = 'triangle';
cpSelectH2.value = 'bell';
const cpColors = ['var(--wave)', '#d97706', '#a855f7'];
const cpDashes = ['', '7 4', '2 4'];
const cpCurve = (label, series, index = 0) => ({ label, series, color: cpColors[index], dash: cpDashes[index] });

function cpCalculate(property, xDefinition, h1Definition, h2Definition, impulseDelay, a, b) {
  const x = cpSample(xDefinition), h1 = cpSample(h1Definition), h2 = cpSample(h2Definition);
  const hLabel = property === 'associative' || property === 'distributive' ? 'h₁(t)' : 'h(t)';
  let inputs = [cpCurve('x(t)', x), cpCurve(hLabel, h1, 1)], results = [], intermediate = [], impulse = null;
  let unit = 'Resultado (u.a.²·s)', range = [-3, 3];
  if (property === 'commutative') results = [cpCurve('x * h', cpConvolve(x, h1)), cpCurve('h * x', cpConvolve(h1, x), 1)];
  if (property === 'associative') {
    const inner1 = cpConvolve(h1, h2), inner2 = cpConvolve(x, h1);
    inputs.push(cpCurve('h₂(t)', h2, 2));
    intermediate = [cpCurve('h₁ * h₂', inner1), cpCurve('x * h₁', inner2, 1)];
    results = [cpCurve('x * (h₁ * h₂)', cpConvolve(x, inner1)), cpCurve('(x * h₁) * h₂', cpConvolve(inner2, h2), 1)];
    unit = 'Resultado (u.a.³·s²)'; range = [-4, 4];
  }
  if (property === 'distributive') {
    inputs.push(cpCurve('h₂(t)', h2, 2));
    const branch1 = cpConvolve(x, h1), branch2 = cpConvolve(x, h2);
    intermediate = [cpCurve('x * h₁', branch1), cpCurve('x * h₂', branch2, 1)];
    results = [cpCurve('x * (h₁ + h₂)', cpConvolve(x, cpAdd(h1, h2))), cpCurve('(x * h₁) + (x * h₂)', cpAdd(branch1, branch2), 1)];
  }
  if (property === 'identity' || property === 'impulse-shift') {
    const delay = property === 'identity' ? 0 : impulseDelay;
    inputs = [cpCurve('x(t)', x)];
    impulse = { t: delay, label: property === 'identity' ? 'δ(t), peso 1' : `δ(t − t₀), t₀ = ${cpTimeFormat.format(delay)} s, peso 1` };
    const shifted = cpShift(x, delay);
    const evaluated = { start: shifted.start, values: Array.from({ length: x.values.length }, (_, index) => cpValue(x, shifted.start + index * cpStep - delay)) };
    results = [cpCurve(property === 'identity' ? 'x * δ' : 'x * δ(t − t₀)', shifted), cpCurve(property === 'identity' ? 'x(t)' : 'x(t − t₀)', evaluated, 1)];
    unit = 'Resultado (u.a.)'; range = [-4, 4];
  }
  if (property === 'time-shift') {
    inputs = [cpCurve('x(t − a)', cpShift(x, a)), cpCurve('h(t − b)', cpShift(h1, b), 1)];
    results = [cpCurve('x(t − a) * h(t − b)', cpConvolve(cpShift(x, a), cpShift(h1, b))), cpCurve('(x * h)(t − a − b)', cpShift(cpConvolve(x, h1), a + b), 1)];
    range = [-5, 5];
  }
  if (property === 'derivative') {
    results = [cpCurve('d(x * h)/dt', cpDerivativeOfConvolution(xDefinition, h1Definition)), cpCurve('x′ * h', cpConvolveDerivative(xDefinition, h1), 1), cpCurve('x * h′', cpConvolveDerivative(h1Definition, x), 2)];
    unit = 'Derivada (u.a.²)';
  }
  return { inputs, results, intermediate, impulse, unit, range };
}

function cpLegend(host, curves, impulse) {
  host.replaceChildren();
  for (const curve of curves) {
    const item = document.createElement('span'); item.className = 'legend-item';
    const swatch = document.createElement('span'); swatch.className = 'cp-swatch';
    swatch.style.borderTop = `3px ${curve.dash ? 'dashed' : 'solid'} ${curve.color}`;
    swatch.setAttribute('aria-hidden', 'true');
    item.append(swatch, curve.label); host.append(item);
  }
  if (impulse) {
    const item = document.createElement('span'); item.className = 'legend-item';
    item.textContent = `↑ ${impulse.label}`; host.append(item);
  }
}

function cpPlot(plot, curves, range, unit, impulse = null) {
  const width = Math.max(240, plot.clientWidth), height = Math.max(230, plot.clientHeight);
  plot.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const left = 58, right = width - 18, top = 30, bottom = height - 42;
  const times = Array.from({ length: 1201 }, (_, index) => range[0] + (range[1] - range[0]) * index / 1200);
  const samples = curves.map(curve => times.map(time => cpValue(curve.series, time)));
  const maximum = Math.max(0.5, Math.ceil(Math.max(...samples.flat().map(Math.abs), impulse ? 1 : 0) * 1.15 * 2) / 2);
  const x = t => left + (t - range[0]) / (range[1] - range[0]) * (right - left);
  const y = value => top + (1 - value / maximum) / 2 * (bottom - top);
  let svg = `<title>${plot.getAttribute('aria-label')}</title>`;
  for (let tick = Math.ceil(range[0]); tick <= range[1]; tick++) {
    svg += `<line class="${tick === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${x(tick)}" x2="${x(tick)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(tick)}" y="${bottom + 18}" text-anchor="middle">${tick}</text>`;
  }
  for (let tick = -2; tick <= 2; tick++) {
    const value = tick * maximum / 2;
    svg += `<line class="${tick === 0 ? 'plot-axis-line' : 'plot-grid-line'}" x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}"/><text class="plot-tick-label" x="${left - 8}" y="${y(value) + 4}" text-anchor="end">${cpNumber.format(value)}</text>`;
  }
  curves.forEach((curve, index) => {
    const path = samples[index].map((value, i) => `${i ? 'L' : 'M'}${x(times[i]).toFixed(2)},${y(value).toFixed(2)}`).join(' ');
    svg += `<path class="cp-curve" d="${path}" fill="none" stroke="${curve.color}" stroke-width="${index === 0 ? 3.5 : 2}"${curve.dash ? ` stroke-dasharray="${curve.dash}"` : ''} vector-effect="non-scaling-stroke"/>`;
  });
  if (impulse) {
    svg += `<defs><marker id="cp-impulse-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#d97706"/></marker></defs><g class="cp-impulse" role="img" aria-label="${impulse.label}"><line x1="${x(impulse.t)}" x2="${x(impulse.t)}" y1="${y(0)}" y2="${y(maximum * 0.75)}" stroke="#d97706" stroke-width="2.5" marker-end="url(#cp-impulse-arrow)"/><text class="plot-tick-label" x="${x(impulse.t) + 8}" y="${y(maximum * 0.75) - 8}">Peso 1</text></g>`;
  }
  plot.innerHTML = svg + `<text class="plot-axis-label" x="${left}" y="17">${unit}</text><text class="plot-axis-label" x="${right}" y="${height - 3}" text-anchor="end">Tiempo (s)</text>`;
  return samples;
}

function cpRenderBlocks() {
  const impulseDelay = cpTimeFormat.format(Number(cpImpulseSlider.value));
  const a = cpTimeFormat.format(Number(cpShiftA.value)), b = cpTimeFormat.format(Number(cpShiftB.value));
  const total = cpTimeFormat.format(Number(cpShiftA.value) + Number(cpShiftB.value));
  const models = {
    commutative: {
      description: 'Dos sistemas en cascada tienen la misma respuesta al intercambiar su orden. Se excitan con δ(t) para que la salida sea exactamente x * h.',
      rows: [{ title: 'Primero x, después h', input: 'δ(t)', blocks: [['x(t)'], ['h(t)']] }, { title: 'Primero h, después x', input: 'δ(t)', blocks: [['h(t)'], ['x(t)']] }],
    },
    associative: {
      description: 'Agrupar h₁ y h₂ en un único bloque equivale a conectarlos en cascada. En ambos casos la entrada es x(t).',
      rows: [{ title: 'Un único sistema equivalente', blocks: [['h₁(t) * h₂(t)']] }, { title: 'Dos sistemas en cascada', blocks: [['h₁(t)'], ['h₂(t)']] }],
    },
    distributive: {
      description: 'La misma entrada se aplica a h₁ y h₂ en paralelo y se suman sus salidas. El conjunto equivale a un único bloque de respuesta h₁ + h₂.',
      rows: [{ title: 'Dos ramas en paralelo y un sumador', parallel: true }, { title: 'Un único sistema equivalente', blocks: [['h₁(t) + h₂(t)']] }],
    },
    identity: {
      description: 'Un sistema de respuesta impulsional δ(t) deja pasar la entrada sin modificarla: equivale a una conexión directa.',
      rows: [{ title: 'Sistema identidad', blocks: [['δ(t)']] }, { title: 'Conexión directa: y(t) = x(t)', blocks: [] }],
    },
    'impulse-shift': {
      description: 'La respuesta δ(t − t₀) equivale a un bloque que desplaza la entrada en t₀. Un t₀ negativo representa un adelanto.',
      rows: [{ title: 'Sistema con respuesta impulsional desplazada', blocks: [['δ(t − t₀)', 't₀ = ' + impulseDelay + ' s']] }, { title: 'Desplazamiento equivalente', blocks: [['Retardo t₀', impulseDelay + ' s']] }],
    },
    'time-shift': {
      description: 'Un retardo a en la entrada y un retardo b en la respuesta de h equivalen a un único retardo a + b en la salida.',
      rows: [{ title: 'Retardos antes y después del sistema h', blocks: [['Retardo a', a + ' s'], ['h(t)'], ['Retardo b', b + ' s']] }, { title: 'Un único retardo total a + b', blocks: [['h(t)'], ['Retardo a + b', total + ' s']] }],
    },
    derivative: {
      description: 'Derivar la salida de h equivale a derivar primero la entrada, o a usar un sistema cuya respuesta impulsional sea h′. Se comparan las tres conexiones.',
      rows: [{ title: 'Derivar después del sistema', blocks: [['h(t)'], ['Derivador', 'd/dt']] }, { title: 'Derivar antes del sistema', blocks: [['Derivador', 'd/dt'], ['h(t)']] }, { title: 'Derivar la respuesta impulsional del sistema', blocks: [['h′(t)']] }],
    },
  };
  const model = models[cpProperty];
  document.querySelector('#cp-blocks-description').textContent = model.description;
  const arrow = path => `<path class="cp-block-wire" d="${path}" marker-end="url(#cp-block-arrow)"/>`;
  const text = (x, y, value, className = 'cp-block-label') => `<text class="${className}" x="${x}" y="${y}" text-anchor="middle">${value}</text>`;
  const block = (x, y, width, lines) => `<rect class="cp-system-block" x="${x}" y="${y - 34}" width="${width}" height="68" rx="5"/>`
    + lines.map((line, index) => text(x + width / 2, y + (index - (lines.length - 1) / 2) * 25 + 7, line)).join('');
  let svg = `<title id="cp-blocks-svg-title">${cpProperties[cpProperty].title}: sistemas equivalentes</title><desc id="cp-blocks-svg-description">${model.description} ${model.rows.map(row => row.title).join('. ')}. Todas las conexiones producen la misma salida y(t).</desc><defs><marker id="cp-block-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--accent)"/></marker></defs>`;
  model.rows.forEach((row, index) => {
    const center = 110 + index * 210;
    svg += `<g class="cp-block-equivalent" role="group" aria-label="${row.title}">` + text(450, center - 80, row.title, 'cp-block-caption')
      + text(42, center + 7, row.input ?? 'x(t)') + text(850, center + 7, 'y(t)');
    if (row.parallel) {
      svg += `<path class="cp-block-wire" d="M80 ${center}H135"/><circle class="cp-block-junction" cx="135" cy="${center}" r="4"/>`
        + arrow(`M135 ${center}V${center - 40}H250`) + arrow(`M135 ${center}V${center + 40}H250`)
        + block(250, center - 40, 260, ['h₁(t)']) + block(250, center + 40, 260, ['h₂(t)'])
        + arrow(`M510 ${center - 40}H700V${center - 20}`) + arrow(`M510 ${center + 40}H700V${center + 20}`)
        + `<circle class="cp-block-summer" cx="700" cy="${center}" r="20"/>` + text(700, center + 8, '+')
        + arrow(`M720 ${center}H810`);
    } else if (!row.blocks.length) {
      svg += arrow(`M80 ${center}H810`);
    } else {
      const count = row.blocks.length, width = count === 1 ? 320 : count === 2 ? 200 : 160;
      const starts = count === 1 ? [290] : count === 2 ? [180, 520] : [135, 370, 605];
      let previous = 80;
      row.blocks.forEach((lines, blockIndex) => {
        svg += arrow(`M${previous} ${center}H${starts[blockIndex]}`) + block(starts[blockIndex], center, width, lines);
        previous = starts[blockIndex] + width;
      });
      svg += arrow(`M${previous} ${center}H810`);
    }
    svg += '</g>';
  });
  const host = document.querySelector('#cp-blocks-diagram');
  host.setAttribute('viewBox', `0 0 900 ${model.rows.length * 210}`);
  host.innerHTML = svg;
}

let cpModel;
function cpDraw() {
  if (!cpModel) return;
  const { inputs, results, intermediate, impulse, range, unit } = cpModel;
  cpPlot(document.querySelector('#cp-input-plot'), inputs, range, 'Entradas ordinarias (u.a.)', impulse);
  if (intermediate.length) cpPlot(document.querySelector('#cp-intermediate-plot'), intermediate, range, 'Convolución (u.a.²·s)');
  const samples = cpPlot(document.querySelector('#cp-result-plot'), results, range, unit);
  const error = Math.max(...samples.slice(1).flatMap(values => values.map((value, index) => Math.abs(value - samples[0][index]))));
  document.querySelector('#cp-error').textContent = `Diferencia máxima entre los miembros: ${error < 1e-10 ? '0 (a precisión numérica)' : cpNumber.format(error) + ' ' + (cpProperty === 'derivative' ? 'u.a.²' : unit.slice(unit.indexOf('(') + 1, -1))}.${cpProperty === 'derivative' ? ' La derivada del resultado se aproxima mediante diferencias centradas; las discrepancias pequeñas son numéricas.' : ' Las curvas coincidentes verifican la propiedad para estas señales.'}`;
}

let cpFormulaQueue = Promise.resolve();
let cpFormulaVersion = 0;
function cpUpdate() {
  const definition = id => cpDefinitions.find(item => item.id === id);
  const property = cpProperties[cpProperty];
  cpRenderBlocks();
  const triple = cpProperty === 'associative' || cpProperty === 'distributive';
  const delta = cpProperty === 'identity' || cpProperty === 'impulse-shift';
  document.querySelector('#cp-h1-control').hidden = delta;
  document.querySelector('#cp-h2-control').hidden = !triple;
  document.querySelector('#cp-h1-label').textContent = triple ? 'Señal h₁(t)' : 'Señal h(t)';
  document.querySelector('#cp-impulse-control').hidden = cpProperty !== 'impulse-shift';
  document.querySelector('#cp-shifts-control').hidden = cpProperty !== 'time-shift';
  for (const [slider, id] of [[cpImpulseSlider, 'cp-impulse-shift-value'], [cpShiftA, 'cp-shift-a-value'], [cpShiftB, 'cp-shift-b-value']]) {
    document.querySelector(`#${id}`).textContent = `${cpTimeFormat.format(Number(slider.value))} s`;
    slider.setAttribute('aria-valuetext', `${cpTimeFormat.format(Number(slider.value))} segundos`);
  }
  document.querySelector('#cp-property-title').textContent = property.title;
  document.querySelector('#cp-explanation').textContent = property.explanation;
  document.querySelector('#cp-recipe').textContent = property.recipe;
  document.querySelector('#cp-input-note').textContent = delta ? 'La segunda entrada es una delta de peso 1, dibujada como una flecha simbólica.' : 'Todos los pulsos son cero fuera de su base. Los pulsos rectangulares toman la media de sus límites en los extremos.';
  document.querySelector('#cp-status').textContent = cpProperty === 'time-shift' ? `Retardo total a + b = ${cpTimeFormat.format(Number(cpShiftA.value) + Number(cpShiftB.value))} s.` : cpProperty === 'impulse-shift' ? `Retardo aplicado: ${cpTimeFormat.format(Number(cpImpulseSlider.value))} s.` : 'Las curvas de los miembros se dibujan con trazos distintos para comparar su coincidencia.';
  cpModel = cpCalculate(cpProperty, definition(cpSelectX.value), definition(cpSelectH1.value), definition(cpSelectH2.value), Number(cpImpulseSlider.value), Number(cpShiftA.value), Number(cpShiftB.value));
  document.querySelector('#cp-intermediate-card').hidden = !cpModel.intermediate.length;
  cpLegend(document.querySelector('#cp-input-legend'), cpModel.inputs, cpModel.impulse);
  cpLegend(document.querySelector('#cp-result-legend'), cpModel.results);
  cpLegend(document.querySelector('#cp-intermediate-legend'), cpModel.intermediate);
  const version = ++cpFormulaVersion;
  cpFormulaQueue = cpFormulaQueue.catch(() => {}).then(async () => {
    if (window.MathJax?.startup?.promise) await window.MathJax.startup.promise;
    if (version !== cpFormulaVersion) return;
    const host = document.querySelector('#cp-equation');
    window.MathJax?.typesetClear?.([host]);
    host.style.fontSize = '';
    host.textContent = property.latex;
    if (window.MathJax?.typesetPromise) await window.MathJax.typesetPromise([host]);
    const formula = host.querySelector('mjx-container');
    const needed = formula ? Math.max(formula.scrollWidth, formula.getBoundingClientRect().width) : 0;
    if (needed > host.clientWidth - 2 && host.clientWidth > 2) host.style.fontSize = `${parseFloat(getComputedStyle(host).fontSize) * (host.clientWidth - 2) / needed}px`;
  });
  cpDraw();
}
for (const button of cpButtons) button.addEventListener('click', () => {
  cpProperty = button.dataset.cpProperty;
  for (const other of cpButtons) other.setAttribute('aria-pressed', String(other === button));
  cpUpdate();
});
for (const select of [cpSelectX, cpSelectH1, cpSelectH2]) select.addEventListener('change', cpUpdate);
for (const slider of [cpImpulseSlider, cpShiftA, cpShiftB]) slider.addEventListener('input', cpUpdate);
cpUpdate();
let cpResizeFrame;
const cpResize = new ResizeObserver(() => {
  cancelAnimationFrame(cpResizeFrame);
  cpResizeFrame = requestAnimationFrame(cpDraw);
});
for (const plot of document.querySelectorAll('.convolution-properties-page svg')) cpResize.observe(plot);
