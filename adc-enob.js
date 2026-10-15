const adc = selector => document.querySelector(selector);
let adcMode = 'ideal';
const adcNumber = (value, digits = 2) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
function adcVoltage(volts) {
  const magnitude = Math.abs(volts);
  const [scale, unit] = magnitude >= 1 ? [1, 'V'] : magnitude >= .001 ? [.001, 'mV'] : magnitude >= .000001 ? [.000001, 'µV'] : [1e-9, 'nV'];
  return `${adcNumber(volts / scale, 3)} ${unit}`;
}
function calculateAdc(bits, span, sinad) {
  const levels = 2 ** bits;
  const lsb = span / levels;
  const enob = (sinad - 1.76) / 6.02;
  return { levels, lsb, noise: lsb / Math.sqrt(12), snr: 6.02 * bits + 1.76, enob, lost: bits - enob, equivalent: span / 2 ** enob };
}
// FFT radix 2; potencia unilateral normalizada a la senoide de escala completa.
function adcSpectrumPower(samples, fullScalePower) {
  const n = samples.length, real = Float64Array.from(samples), imaginary = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [real[i], real[j]] = [real[j], real[i]];
  }
  for (let size = 2; size <= n; size *= 2) {
    for (let start = 0; start < n; start += size) {
      for (let j = 0; j < size / 2; j++) {
        const angle = -2 * Math.PI * j / size;
        const a = start + j, b = a + size / 2;
        const re = real[b] * Math.cos(angle) - imaginary[b] * Math.sin(angle);
        const im = real[b] * Math.sin(angle) + imaginary[b] * Math.cos(angle);
        real[b] = real[a] - re; imaginary[b] = imaginary[a] - im;
        real[a] += re; imaginary[a] += im;
      }
    }
  }
  return Array.from({ length: n / 2 + 1 }, (_, k) =>
    (k === 0 || k === n / 2 ? 1 : 2) * (real[k] ** 2 + imaginary[k] ** 2) / (n * n * fullScalePower));
}
function simulateAdcSpectrum(bits, span, sinad = null) {
  const count = 2048, levels = 2 ** bits, step = span / levels;
  const sine = Array.from({ length: count }, (_, i) => Math.sin(2 * Math.PI * 37 * i / count));
  const cosine = sine.map((_, i) => Math.cos(2 * Math.PI * 37 * i / count));
  const noise = new Float64Array(count);
  let attenuation = 1;
  if (sinad !== null) {
    // Misma realización de ruido en cada ajuste: solo cambia su potencia.
    let seed = 123456789;
    for (let i = 0; i < count; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      noise[i] = seed / 4294967296 - .5;
    }
    const mean = noise.reduce((sum, v) => sum + v, 0) / count;
    const sinProjection = noise.reduce((sum, v, i) => sum + v * sine[i], 0) * 2 / count;
    const cosProjection = noise.reduce((sum, v, i) => sum + v * cosine[i], 0) * 2 / count;
    for (let i = 0; i < count; i++) noise[i] -= mean + sinProjection * sine[i] + cosProjection * cosine[i];
    const rms = Math.sqrt(noise.reduce((sum, v) => sum + v * v, 0) / count);
    const target = Math.SQRT1_2 * 10 ** (-sinad / 20);
    for (let i = 0; i < count; i++) noise[i] *= target / rms;
    const peak = sine.reduce((max, v, i) => Math.max(max, Math.abs(v + noise[i])), 1);
    attenuation = .999 / peak;
  }
  const analog = sine.map((v, i) => span / 2 * attenuation * (v + noise[i]));
  const quantized = analog.map(v => {
    const code = Math.min(levels - 1, Math.max(0, Math.floor((v + span / 2) / step)));
    return -span / 2 + (code + .5) * step;
  });
  const mean = quantized.reduce((sum, v) => sum + v, 0) / count;
  const reference = span ** 2 / 8;
  return { analog: adcSpectrumPower(analog, reference), quantized: adcSpectrumPower(quantized.map(v => v - mean), reference), backoff: -20 * Math.log10(attenuation) };
}
function combineAdcSnr(originalSnr, quantizationSnr) {
  return -10 * Math.log10(10 ** (-originalSnr / 10) + 10 ** (-quantizationSnr / 10));
}
function renderAdcSpectrum(bits, span, measured, sinad) {
  const data = simulateAdcSpectrum(bits, span, measured ? sinad : null);
  const x = hz => 72 + hz / 4096 * 700;
  const y = db => 32 + (0 - Math.max(-240, Math.min(0, db))) / 240 * 284;
  let svg = '<title>Espectro de potencia: analógica y cuantificada</title>';
  for (let db = -240; db <= 0; db += 40) svg += `<line class="plot-grid-line" x1="72" x2="772" y1="${y(db)}" y2="${y(db)}"/><text class="plot-tick-label" x="62" y="${y(db) + 4}" text-anchor="end">${db}</text>`;
  for (const hz of [0, 1024, 2048, 3072, 4096]) svg += `<line class="plot-grid-line" x1="${x(hz)}" x2="${x(hz)}" y1="32" y2="316"/><text class="plot-tick-label" x="${x(hz)}" y="340" text-anchor="middle">${hz}</text>`;
  for (const [key, className] of [['quantized', 'adc-spectrum-digital'], ['analog', 'adc-spectrum-analog']]) {
    const path = data[key].map((power, k) => `${k ? 'L' : 'M'}${x(k * 4).toFixed(2)},${y(10 * Math.log10(Math.max(power, 1e-24))).toFixed(2)}`).join(' ');
    svg += `<path class="${className}" d="${path}" fill="none" vector-effect="non-scaling-stroke"/>`;
  }
  svg += '<text class="plot-axis-label" x="72" y="18">Potencia por bin (dBFS)</text><text class="plot-axis-label" x="772" y="370" text-anchor="end">Frecuencia (Hz)</text>';
  adc('#adc-spectrum-plot').innerHTML = svg;
  adc('#adc-spectrum-note').textContent = `Cuantificación nominal de ${bits} bits. Ambas señales comparten los ejes y la referencia de potencia.${measured ? ` La señal analógica incluye ruido de banda ancha ajustado a un SINAD de ${adcNumber(sinad)} dB, sin distorsión añadida. La señal cuantificada se obtiene de esa misma entrada ruidosa. Para evitar saturación, se atenúan señal y ruido por igual: el tono queda ${adcNumber(data.backoff)} dB por debajo de escala completa, conservando el SINAD. El ENOB de la calculadora sigue siendo el equivalente a escala completa del SINAD introducido, no una medida de la curva cuantificada.` : ' La señal analógica es una senoide ideal sin ruido añadido.'}`;
  return data;
}
function renderAdc() {
  const bitsInput = adc('#adc-bits'), vrefInput = adc('#adc-vref'), sinadInput = adc('#adc-sinad');
  const bits = bitsInput.valueAsNumber;
  const unit = Number(adc('#adc-unit').value);
  vrefInput.min = String(1e-6 / unit);
  vrefInput.max = String(1000 / unit);
  const vref = vrefInput.valueAsNumber * unit;
  const sinad = sinadInput.valueAsNumber;
  const measured = adcMode === 'measured';
  const errors = [];
  const validate = (input, valid, message) => {
    input.setAttribute('aria-invalid', String(!valid));
    if (!valid) errors.push(message);
  };
  validate(bitsInput, Number.isInteger(bits) && bits >= 1 && bits <= 32, 'Introduce un número entero de bits entre 1 y 32.');
  validate(vrefInput, Number.isFinite(vref) && vref >= 1e-6 && vref <= 1000, 'Introduce una referencia entre 1 µV y 1000 V (respeta la unidad seleccionada).');
  validate(sinadInput, !measured || (Number.isFinite(sinad) && sinad >= -20 && sinad <= 200), 'Introduce un SINAD entre −20 y 200 dB.');
  adc('#adc-error').textContent = errors.join(' ');
  document.querySelectorAll('[data-bits]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.bits) === bits)));
  adc('#adc-result-title').textContent = measured ? 'Resultados a partir del SINAD' : 'Resultados ideales';
  if (errors.length) {
    adc('#adc-results').textContent = 'Corrige los parámetros para calcular los resultados.';
    adc('#adc-spectrum-plot').replaceChildren();
    adc('#adc-spectrum-note').textContent = 'Corrige los parámetros para mostrar el espectro.';
    return;
  }
  const span = vref * Number(adc('#adc-range').value);
  const r = calculateAdc(bits, span, sinad);
  const spectrum = renderAdcSpectrum(bits, span, measured, sinad);
  const quantizationSnr = r.snr - spectrum.backoff;
  const finalSnr = combineAdcSnr(measured ? sinad : Infinity, quantizationSnr);
  const idealMetrics = [
    ['Niveles de cuantificación', adcNumber(r.levels, 0)],
    ['LSB nominal', adcVoltage(r.lsb)],
    ['Ruido de cuantificación RMS ideal', adcVoltage(r.noise)],
    ['SNR ideal (senoide a escala completa)', `${adcNumber(r.snr)} dB`],
  ];
  const metrics = measured ? [
    ['Bits efectivos (ENOB)', `${adcNumber(r.enob)} bits`],
    ['Bits perdidos respecto a N', `${adcNumber(r.lost)} bits`],
    ['SNR ideal para N bits', `${adcNumber(r.snr)} dB`],
    ['LSB equivalente (no físico)', adcVoltage(r.equivalent)],
    ['LSB nominal', adcVoltage(r.lsb)],
    ['Anchura del rango (FSR)', adcVoltage(span)],
  ] : idealMetrics;
  metrics.push(
    ['SNR original de la señal (modelo sin distorsión)', measured ? `${adcNumber(sinad)} dB` : '∞ (sin ruido añadido)'],
    ['SNR de cuantificación al nivel simulado', `${adcNumber(quantizationSnr)} dB`],
    ['SNR final estimado (señal + cuantificación)', `${adcNumber(finalSnr)} dB`],
  );
  const fragment = document.createDocumentFragment();
  for (const [label, value] of metrics) {
    const card = document.createElement('article'); card.className = 'power-metric';
    const name = document.createElement('span'); name.textContent = label;
    const result = document.createElement('strong'); result.textContent = value;
    card.append(name, result); fragment.append(card);
  }
  adc('#adc-results').replaceChildren(fragment);
}
adc('#adc-form').addEventListener('submit', event => event.preventDefault());
adc('#adc-form').addEventListener('input', renderAdc);
adc('#adc-form').addEventListener('change', renderAdc);
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  adcMode = button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(mode => mode.setAttribute('aria-pressed', String(mode === button)));
  adc('#adc-sinad-field').hidden = adcMode !== 'measured';
  adc('#adc-sinad').disabled = adcMode !== 'measured';
  renderAdc();
}));
document.querySelectorAll('[data-bits]').forEach(button => button.addEventListener('click', () => {
  adc('#adc-bits').value = button.dataset.bits;
  renderAdc();
}));

renderAdc();
