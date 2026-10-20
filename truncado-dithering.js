"use strict";
function spectrumPower(samples, fullScalePower) {
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
const N = 2048;
const $ = id => document.getElementById(id);
const format = value => Number.isFinite(value) ? value.toLocaleString('es-ES', { maximumFractionDigits: 2 }) : '∞';
function randomStream(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed + 0.5) / 4294967296;
  };
}
function simulate(sourceBits, snr, targetBits, enabled, type, frequency = 148) {
  const toneBin = frequency / 4;
  const random = randomStream(123456789), dither = randomStream(987654321);
  const sine = Array.from({ length: N }, (_, i) => Math.sin(2 * Math.PI * toneBin * i / N));
  const cosine = sine.map((_, i) => Math.cos(2 * Math.PI * toneBin * i / N));
  const noise = sine.map(() => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random()));
  const mean = noise.reduce((a, b) => a + b, 0) / N;
  const ps = noise.reduce((a, b, i) => a + b * sine[i], 0) * 2 / N;
  const pc = noise.reduce((a, b, i) => a + b * cosine[i], 0) * 2 / N;
  noise.forEach((v, i) => { noise[i] = v - mean - ps * sine[i] - pc * cosine[i]; });
  const rms = Math.sqrt(noise.reduce((a, b) => a + b * b, 0) / N);
  const noiseScale = .25 / Math.SQRT2 * 10 ** (-snr / 20) / rms;
  const sourceStep = 2 / 2 ** sourceBits, step = 2 / 2 ** targetBits;
  let sourceClips = 0, targetClips = 0;
  const source = sine.map((v, i) => {
    const code = Math.round((.25 * v + noise[i] * noiseScale) / sourceStep);
    const limited = Math.max(-(2 ** (sourceBits - 1)), Math.min(2 ** (sourceBits - 1) - 1, code));
    if (code !== limited) sourceClips++;
    return limited * sourceStep;
  });
  const target = source.map(v => {
    let d = 0;
    if (enabled) {
      if (type === 'rectangular') d = (dither() - .5) * step;
      if (type === 'triangular') d = (dither() + dither() - 1) * step;
      if (type === 'gaussian') d = .5 * step * Math.sqrt(-2 * Math.log(dither())) * Math.cos(2 * Math.PI * dither());
    }
    const code = Math.floor((v + d) / step);
    const limited = Math.max(-(2 ** (targetBits - 1)), Math.min(2 ** (targetBits - 1) - 1, code));
    if (code !== limited) targetClips++;
    return limited * step;
  });
  return { source, target, step, sourceClips, targetClips };
}
function measures(samples, toneBin = 37) {
  const power = spectrumPower(samples, .5);
  const rest = power.reduce((a, b, i) => a + (i !== 0 && i !== toneBin ? b : 0), 0);
  return { power, ratio: 10 * Math.log10(power[toneBin] / rest), dc: samples.reduce((a, b) => a + b, 0) / N };
}
function drawSpectrum(source, target) {
  const x = k => 72 + k / (N / 2) * 700;
  const y = db => 32 + (0 - Math.max(-180, Math.min(0, db))) / 180 * 284;
  let svg = '<title>Espectros de origen (discontinuo) y destino (continuo)</title>';
  for (let db = -180; db <= 0; db += 30) svg += `<line class="plot-grid-line" x1="72" x2="772" y1="${y(db)}" y2="${y(db)}"/><text class="plot-tick-label" x="62" y="${y(db) + 4}" text-anchor="end">${db}</text>`;
  for (const hz of [0, 1024, 2048, 3072, 4096]) svg += `<line class="plot-grid-line" x1="${x(hz / 4)}" x2="${x(hz / 4)}" y1="32" y2="316"/><text class="plot-tick-label" x="${x(hz / 4)}" y="340" text-anchor="middle">${hz}</text>`;
  for (const [power, style] of [[target, 'destination'], [source, 'original']]) {
    const path = power.map((p, k) => `${k ? 'L' : 'M'}${x(k).toFixed(2)},${y(10 * Math.log10(Math.max(p, 1e-18))).toFixed(2)}`).join(' ');
    svg += `<path class="${style}" d="${path}" vector-effect="non-scaling-stroke"/>`;
  }
  svg += '<text class="plot-axis-label" x="72" y="18">Potencia por bin (dBFS)</text><text class="plot-axis-label" x="772" y="370" text-anchor="end">Frecuencia (Hz)</text>';
  $('truncation-spectrum').innerHTML = svg;
}
let audioContext = null;
let audioGain = null;
let audioSamples = null;
let audioPlaying = false;
let audioRequest = 0;
let audioParameters = null;
let audioWorklet = null;
let audioModulePromise = null;

// El módulo se incluye como URL de datos para permitir abrir la demo como archivo local.
function registerContinuousAudio() {
  class ContinuousTruncation extends AudioWorkletProcessor {
    constructor() {
      super();
      this.parameters = null;
      this.phase = 0;
      this.position = 0;
      this.left = 0;
      this.right = 0;
      this.ready = false;
      this.port.onmessage = event => { this.parameters = event.data; };
    }
    gaussian() {
      return Math.sqrt(-2 * Math.log(Math.max(Number.MIN_VALUE, Math.random()))) * Math.cos(2 * Math.PI * Math.random());
    }
    nextSample() {
      const { sourceBits, snr, targetBits, enabled, type, frequency } = this.parameters;
      const sourceStep = 2 / 2 ** sourceBits, step = 2 / 2 ** targetBits;
      const sourceLimit = 2 ** (sourceBits - 1), targetLimit = 2 ** (targetBits - 1);
      const input = .25 * Math.sin(this.phase) + .25 / Math.SQRT2 * 10 ** (-snr / 20) * this.gaussian();
      this.phase = (this.phase + 2 * Math.PI * frequency / 8192) % (2 * Math.PI);
      const code = Math.max(-sourceLimit, Math.min(sourceLimit - 1, Math.round(input / sourceStep)));
      let dither = 0;
      if (enabled) {
        if (type === 'rectangular') dither = (Math.random() - .5) * step;
        if (type === 'triangular') dither = (Math.random() + Math.random() - 1) * step;
        if (type === 'gaussian') dither = .5 * step * this.gaussian();
      }
      return Math.max(-targetLimit, Math.min(targetLimit - 1, Math.floor((code * sourceStep + dither) / step))) * step;
    }
    process(inputs, outputs) {
      const channel = outputs[0][0];
      if (!this.parameters || !channel) return true;
      if (!this.ready) {
        this.left = this.nextSample();
        this.right = this.nextSample();
        this.ready = true;
      }
      // Interpolación continua entre muestras de 8192 Hz, sin reinicios entre bloques.
      for (let i = 0; i < channel.length; i++) {
        channel[i] = this.left + (this.right - this.left) * this.position;
        this.position += 8192 / sampleRate;
        while (this.position >= 1) {
          this.position -= 1;
          this.left = this.right;
          this.right = this.nextSample();
        }
      }
      return true;
    }
  }
  registerProcessor('continuous-truncation', ContinuousTruncation);
}
async function prepareAudioWorklet() {
  if (!audioModulePromise) {
    const url = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(`(${registerContinuousAudio.toString()})();`);
    audioModulePromise = audioContext.audioWorklet.addModule(url);
    audioModulePromise.catch(() => { audioModulePromise = null; });
  }
  await audioModulePromise;
}

function audioStatus() {
  $('audio-state').textContent = audioPlaying
    ? `Reproducción continua ${$('dither-enabled').checked ? 'con dithering (' + $('dither-type').selectedOptions[0].textContent + ')' : 'sin dithering'} · ${$('frequency-value').textContent}.`
    : 'Reproducción detenida.';
  $('audio-play').disabled = audioPlaying || !audioSamples;
  $('audio-stop').disabled = !audioPlaying;
}
function stopAudio() {
  audioRequest++;
  audioPlaying = false;
  if (audioGain) {
    audioGain.gain.cancelScheduledValues(audioContext.currentTime);
    audioGain.gain.setTargetAtTime(0, audioContext.currentTime, .005);
  }
  if (audioWorklet) {
    const old = audioWorklet;
    audioWorklet = null;
    setTimeout(() => { old.disconnect(); old.port.close(); }, 50);
  }
  audioStatus();
}
async function playAudio() {
  if (!audioSamples || audioPlaying) return;
  const request = ++audioRequest;
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
      audioGain = audioContext.createGain();
      audioGain.gain.value = Number($('audio-volume').value) / 100;
      audioGain.connect(audioContext.destination);
    }
    await audioContext.resume();
    if (request !== audioRequest || !audioSamples) return;
    await prepareAudioWorklet();
    if (request !== audioRequest || !audioSamples) return;
    audioWorklet = new AudioWorkletNode(audioContext, 'continuous-truncation', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] });
    audioWorklet.port.postMessage(audioParameters);
    audioWorklet.connect(audioGain);
    audioWorklet.onprocessorerror = () => {
      stopAudio();
      $('audio-state').textContent = 'El motor de audio se ha detenido. Pulsa reproducir para reiniciarlo.';
    };
    audioGain.gain.cancelScheduledValues(audioContext.currentTime);
    audioGain.gain.setValueAtTime(0, audioContext.currentTime);
    audioGain.gain.setTargetAtTime(Number($('audio-volume').value) / 100, audioContext.currentTime, .005);
    audioPlaying = true;
    audioStatus();
  } catch {
    stopAudio();
    $('audio-state').textContent = 'No se ha podido iniciar el audio. Comprueba la salida de sonido y vuelve a pulsar reproducir.';
  }
}
function render() {
  const sourceBits = Number($('source-bits').value), snr = Number($('source-snr').value), targetBits = Number($('target-bits').value);
  const frequency = Number($('tone-frequency').value);
  $('frequency-value').textContent = `${format(frequency)} Hz`;
  const toneBin = frequency / 4;
  const enabled = $('dither-enabled').checked;
  $('dither-type').disabled = !enabled;
  const invalid = [
    ['tone-frequency', !Number.isInteger(toneBin) || frequency < 4 || frequency > 4092],
    ['source-bits', !Number.isInteger(sourceBits) || sourceBits < 2 || sourceBits > 24],
    ['source-snr', $('source-snr').value.trim() === '' || !Number.isFinite(snr) || snr < 0 || snr > 160],
    ['target-bits', !Number.isInteger(targetBits) || targetBits < 2 || targetBits > sourceBits]
  ];
  invalid.forEach(([id, bad]) => $(id).setAttribute('aria-invalid', String(bad)));
  if (invalid.some(([, bad]) => bad)) {
    audioSamples = null;
    stopAudio();
    $('truncation-error').textContent = 'Introduce bits enteros de 2 a 24, destino ≤ origen, un SNR de 0 a 160 dB y una frecuencia de 4 a 4092 Hz en pasos de 4 Hz.';
    $('truncation-spectrum').replaceChildren();
    $('truncation-results').textContent = 'Corrige los parámetros para calcular los resultados.';
    $('spectrum-state').textContent = 'Sin espectro: parámetros no válidos.';
    return;
  }
  $('truncation-error').textContent = '';
  const data = simulate(sourceBits, snr, targetBits, enabled, $('dither-type').value, frequency);
  audioSamples = data.target;
  audioParameters = { sourceBits, snr, targetBits, enabled, type: $('dither-type').value, frequency };
  if (audioWorklet) audioWorklet.port.postMessage(audioParameters);
  audioStatus();
  const source = measures(data.source, toneBin), target = measures(data.target, toneBin);
  const lines = [
    `Bits eliminados: ${sourceBits - targetBits}. Paso de destino: ${data.step.toLocaleString('es-ES', { maximumSignificantDigits: 5 })} unidades normalizadas.`,
    `Origen · señal/(ruido + distorsión): ${format(source.ratio)} dB.`,
    `Destino · señal/(ruido + distorsión): ${format(target.ratio)} dB.`,
    `Continua de origen: ${format(source.dc / data.step)} LSB de destino; continua de destino: ${format(target.dc / data.step)} LSB.`,
    `Muestras saturadas: ${data.sourceClips} en origen, ${data.targetClips} en destino (de ${N}).`
  ];
  $('truncation-results').replaceChildren(...lines.map(line => {
    const p = document.createElement('p'); p.textContent = line; return p;
  }));
  drawSpectrum(source.power, target.power);
  $('spectrum-state').textContent = enabled ? `Dithering activado: ${$('dither-type').selectedOptions[0].textContent}.` : 'Dithering desactivado: truncado directo.';
}
$('audio-play').addEventListener('click', playAudio);
$('audio-stop').addEventListener('click', stopAudio);
$('audio-volume').addEventListener('input', () => {
  const volume = Number($('audio-volume').value);
  $('audio-volume-value').textContent = `${volume} %`;
  if (audioGain) audioGain.gain.setTargetAtTime(volume / 100, audioContext.currentTime, .01);
});
window.addEventListener('pagehide', stopAudio);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopAudio(); });
$('truncation-form').addEventListener('submit' , event => event.preventDefault());
$('truncation-form').addEventListener('input', render);
render();
