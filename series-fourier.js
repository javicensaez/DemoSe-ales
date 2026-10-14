const signalSelect = document.querySelector("#fourier-signal");
const termsInput = document.querySelector("#fourier-terms");
const frequencyInput = document.querySelector("#fourier-frequency");
const dutyInput = document.querySelector("#fourier-duty");
const wavePlot = document.querySelector("#fourier-wave-plot");
const coefficientBody = document.querySelector("#fourier-coefficients");

function formatCoefficient(value) {
  if (Math.abs(value) < 0.0005) return "0";
  return Number(value.toFixed(4)).toString();
}

function renderFourierLab() {
  const signalKey = signalSelect.value;
  const definition = FourierCore.signals[signalKey];
  const count = Number(termsInput.value);
  const frequency = Number(frequencyInput.value);
  const duty = Number(dutyInput.value);
  const period = 1 / frequency;
  const coefficients = FourierCore.coefficients(signalKey, count, duty);
  const phaseAtTime = (time) => time / period;
  const original = (time) => FourierCore.evaluate(signalKey, phaseAtTime(time), duty);
  const approximation = (time) =>
    FourierCore.sum(coefficients, phaseAtTime(time), count);
  const sampledOriginal = [];
  const sampledApproximation = [];
  let squaredError = 0;
  const errorSamples = 1201;

  for (let index = 0; index < errorSamples; index += 1) {
    const time = -period + (2 * period * index) / (errorSamples - 1);
    const targetValue = original(time);
    const sumValue = approximation(time);
    sampledOriginal.push(targetValue);
    sampledApproximation.push(sumValue);
    squaredError += (targetValue - sumValue) ** 2;
  }

  const magnitude = Math.max(
    1,
    ...sampledOriginal.map(Math.abs),
    ...sampledApproximation.map(Math.abs),
  );
  const limit = Math.ceil(magnitude * 1.15 * 2) / 2;
  const halfPeriod = period / 2;
  const xTicks = [-period, -halfPeriod, 0, halfPeriod, period];
  const yTicks = [-limit, 0, limit];
  const curves = [
    { value: original, color: "#164b8c", dash: "7 5", width: 2 },
    { value: approximation, color: "#d97706" },
  ];

  wavePlot.innerHTML = FourierCore.plotMarkup({
    curves,
    xRange: [-period, period],
    yRange: [-limit, limit],
    xTicks,
    yTicks,
    sampleCount: 1201,
  });
  wavePlot.setAttribute(
    "aria-label",
    `${definition.name}, periodo ${formatCoefficient(period)} segundos, y suma parcial hasta el armónico ${count}`,
  );
  document.querySelector("#fourier-wave-name").textContent = definition.name;
  document.querySelector("#fourier-terms-value").textContent = count;
  document.querySelector("#fourier-frequency-value").textContent =
    `${formatCoefficient(frequency)} Hz`;
  document.querySelector("#fourier-duty-value").textContent =
    `${formatCoefficient(duty * 100)} %`;
  document.querySelector("#fourier-period").textContent =
    `T = ${formatCoefficient(period)} s · N = ${count}`;
  document.querySelector("#fourier-error").textContent =
    `Error RMS en dos periodos: ${formatCoefficient(Math.sqrt(squaredError / errorSamples))}`;
  document.querySelector("#fourier-duty-control").hidden = signalKey !== "pulse";
  document.querySelector("#fourier-spectrum").innerHTML =
    FourierCore.spectrumMarkup(coefficients);

  const rows = [
    `<tr><th scope="row">0</th><td>${formatCoefficient(coefficients.a0)}</td><td>—</td><td>${formatCoefficient(Math.abs(coefficients.a0 / 2))}</td><td>—</td></tr>`,
    ...coefficients.terms.slice(1).map((term) => {
      const amplitude = Math.hypot(term.a, term.b);
      const phase = amplitude < 1e-10
        ? "—"
        : formatCoefficient(Math.atan2(-term.b, term.a) * 180 / Math.PI);
      return `<tr><th scope="row">${term.n}</th><td>${formatCoefficient(term.a)}</td><td>${formatCoefficient(term.b)}</td><td>${formatCoefficient(amplitude)}</td><td>${phase}</td></tr>`;
    }),
  ];
  coefficientBody.innerHTML = rows.join("");
}

signalSelect.addEventListener("change", renderFourierLab);
termsInput.addEventListener("input", renderFourierLab);
frequencyInput.addEventListener("input", renderFourierLab);
dutyInput.addEventListener("input", renderFourierLab);

renderFourierLab();
