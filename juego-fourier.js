const signalSelect = document.querySelector("#challenge-signal");
const countButtons = document.querySelectorAll("[data-count]");
const answerA0 = document.querySelector("#answer-a0");
const answerHead = document.querySelector("#answer-table-head");
const answerBody = document.querySelector("#answer-table-body");
const challengePlot = document.querySelector("#challenge-plot");
const signalKeys = Object.keys(FourierCore.signals);
let termCount = 5;
let mode = "trig";
let challengeCount = 1;
let targetCoefficients;
let targetSignal;
let pulseDuty = 0.25;

function formatCoefficient(value) {
  if (Math.abs(value) < 0.0005) return "0";
  return Number(value.toFixed(4)).toString();
}

function initializeChallenge(randomSignal = false) {
  if (randomSignal) {
    const currentIndex = signalKeys.indexOf(signalSelect.value);
    const choices = signalKeys.filter((_, index) => index !== currentIndex);
    signalSelect.value = choices[Math.floor(Math.random() * choices.length)];
    challengeCount += 1;
  }
  targetSignal = signalSelect.value;
  targetCoefficients = FourierCore.coefficients(targetSignal, termCount, pulseDuty);
  answerA0.value = "";
  document.querySelector("#fourier-hint").hidden = true;
  document.querySelector("#fourier-solution").hidden = true;
  document.querySelector("#fourier-feedback").textContent = "";
  document.querySelector("#fourier-score").textContent = "";
  document.querySelector("#next-challenge").hidden = true;
  document.querySelector("#challenge-summary").textContent =
    `${FourierCore.signals[targetSignal].name} · reto ${challengeCount}`;
  renderAnswerTable();
  renderChallenge();
}

function renderAnswerTable() {
  const firstHeader = mode === "trig" ? "aₙ" : "Aₙ";
  const secondHeader = mode === "trig" ? "bₙ" : "φₙ (°)";
  answerHead.innerHTML = `<tr><th scope="col">n</th><th scope="col">${firstHeader}</th><th scope="col">${secondHeader}</th></tr>`;
  answerBody.innerHTML = Array.from({ length: termCount }, (_, index) => {
    const harmonic = index + 1;
    const firstLabel = mode === "trig" ? `a${harmonic}` : `A${harmonic}`;
    const secondLabel = mode === "trig" ? `b${harmonic}` : `fase${harmonic}`;
    return `
      <tr>
        <th scope="row">${harmonic}</th>
        <td><label class="sr-only" for="coefficient-${harmonic}-first">${firstLabel}</label><input id="coefficient-${harmonic}-first" data-n="${harmonic}" data-kind="first" type="text" inputmode="decimal" autocomplete="off" placeholder="0" /></td>
        <td><label class="sr-only" for="coefficient-${harmonic}-second">${secondLabel}</label><input id="coefficient-${harmonic}-second" data-n="${harmonic}" data-kind="second" type="text" inputmode="decimal" autocomplete="off" placeholder="0" /></td>
      </tr>
    `;
  }).join("");
}

function readAnswers() {
  const a0 = answerA0.value.trim() ? FourierCore.parseExpression(answerA0.value) : 0;
  const terms = Array.from({ length: termCount + 1 }, (_, n) => ({ n, a: 0, b: 0 }));
  for (let harmonic = 1; harmonic <= termCount; harmonic += 1) {
    const first = answerBody.querySelector(`[data-n="${harmonic}"][data-kind="first"]`);
    const second = answerBody.querySelector(`[data-n="${harmonic}"][data-kind="second"]`);
    const firstValue = first.value.trim() ? FourierCore.parseExpression(first.value) : 0;
    const secondValue = second.value.trim() ? FourierCore.parseExpression(second.value) : 0;
    if (mode === "trig") {
      terms[harmonic].a = firstValue;
      terms[harmonic].b = secondValue;
    } else {
      if (firstValue < 0) throw new SyntaxError("El módulo Aₙ no puede ser negativo.");
      const phase = secondValue * Math.PI / 180;
      terms[harmonic].a = firstValue * Math.cos(phase);
      terms[harmonic].b = -firstValue * Math.sin(phase);
    }
  }
  return { a0, terms };
}

function scoreAnswers(answers) {
  let errorPower = ((answers.a0 - targetCoefficients.a0) / 2) ** 2;
  let signalPower = (targetCoefficients.a0 / 2) ** 2;
  for (let harmonic = 1; harmonic <= termCount; harmonic += 1) {
    const expected = targetCoefficients.terms[harmonic];
    const actual = answers.terms[harmonic];
    errorPower += ((actual.a - expected.a) ** 2 + (actual.b - expected.b) ** 2) / 2;
    signalPower += (expected.a ** 2 + expected.b ** 2) / 2;
  }
  const score = signalPower === 0
    ? 0
    : Math.max(0, 100 * (1 - Math.sqrt(errorPower / signalPower)));
  return { score, error: Math.sqrt(errorPower) };
}

function renderChallenge(answers = null) {
  const target = (time) => FourierCore.evaluate(targetSignal, time, pulseDuty);
  const userSeries = answers ?? FourierCore.coefficients(targetSignal, 0, pulseDuty);
  const approximation = (time) => FourierCore.sum(userSeries, time, termCount);
  const magnitude = Math.max(
    1,
    ...Array.from({ length: 1201 }, (_, index) => {
      const time = -1 + (2 * index) / 1200;
      return Math.max(Math.abs(target(time)), Math.abs(approximation(time)));
    }),
  );
  const limit = Math.ceil(magnitude * 1.15 * 2) / 2;
  challengePlot.innerHTML = FourierCore.plotMarkup({
    curves: [
      { value: target, color: "#164b8c", dash: "7 5", width: 2 },
      { value: approximation, color: "#d97706" },
    ],
    xRange: [-1, 1],
    yRange: [-limit, limit],
    xTicks: [-1, -0.5, 0, 0.5, 1],
    yTicks: [-limit, 0, limit],
    sampleCount: 1201,
  });
  challengePlot.setAttribute(
    "aria-label",
    `${FourierCore.signals[targetSignal].name} y serie calculada por el alumno hasta el armónico ${termCount}`,
  );
}

function writeAnswers(answers) {
  answerA0.value = formatCoefficient(answers.a0);
  for (let harmonic = 1; harmonic <= termCount; harmonic += 1) {
    const { a, b } = answers.terms[harmonic];
    const first = answerBody.querySelector(`[data-n="${harmonic}"][data-kind="first"]`);
    const second = answerBody.querySelector(`[data-n="${harmonic}"][data-kind="second"]`);
    if (mode === "trig") {
      first.value = formatCoefficient(a);
      second.value = formatCoefficient(b);
    } else {
      const amplitude = Math.hypot(a, b);
      first.value = formatCoefficient(amplitude);
      second.value = formatCoefficient(
        amplitude < 1e-10 ? 0 : Math.atan2(-b, a) * 180 / Math.PI,
      );
    }
  }
}

function showSolution() {
  const solution = [
    `<strong>a₀ = ${formatCoefficient(targetCoefficients.a0)}</strong>`,
    ...targetCoefficients.terms.slice(1).map((term) => {
      if (mode === "trig") {
        return `n = ${term.n}: aₙ = ${formatCoefficient(term.a)}, bₙ = ${formatCoefficient(term.b)}`;
      }
      const amplitude = Math.hypot(term.a, term.b);
      const phase = amplitude < 1e-10
        ? 0
        : Math.atan2(-term.b, term.a) * 180 / Math.PI;
      return `n = ${term.n}: Aₙ = ${formatCoefficient(amplitude)}, φₙ = ${formatCoefficient(phase)}°`;
    }),
  ];
  const solutionElement = document.querySelector("#fourier-solution");
  solutionElement.innerHTML = solution.map((line) => `<p>${line}</p>`).join("");
  solutionElement.hidden = false;
  writeAnswers(targetCoefficients);
  document.querySelector("#fourier-score").textContent = "";
  document.querySelector("#fourier-feedback").textContent = "";
  document.querySelector("#next-challenge").hidden = true;
  renderChallenge(targetCoefficients);
}

function updateMode(nextMode) {
  if (nextMode === mode) return;
  let currentAnswers;
  try {
    currentAnswers = readAnswers();
  } catch (error) {
    document.querySelector("#fourier-feedback").textContent =
      error instanceof SyntaxError
        ? "Corrige las expresiones no válidas antes de cambiar de formato."
        : "No se han podido conservar los coeficientes actuales.";
    return;
  }

  mode = nextMode;
  document.querySelector("#mode-trig").setAttribute("aria-pressed", String(mode === "trig"));
  document.querySelector("#mode-polar").setAttribute("aria-pressed", String(mode === "polar"));
  document.querySelector("#fourier-entry-note").textContent = mode === "trig"
    ? "La serie usa aₙ cos(nω₀t) + bₙ sen(nω₀t)."
    : "Fase en grados y convención Aₙ cos(nω₀t + φₙ): aₙ = Aₙ cos(φₙ), bₙ = −Aₙ sen(φₙ).";
  renderAnswerTable();
  writeAnswers(currentAnswers);
  renderChallenge();
}

function previewAnswers() {
  document.querySelector("#fourier-score").textContent = "";
  document.querySelector("#fourier-feedback").textContent = "";
  document.querySelector("#next-challenge").hidden = true;
  try {
    renderChallenge(readAnswers());
  } catch {
    document.querySelector("#fourier-feedback").textContent =
      "Hay una expresión que no se puede interpretar. Revisa los coeficientes.";
  }
}

countButtons.forEach((button) => {
  button.addEventListener("click", () => {
    termCount = Number(button.dataset.count);
    countButtons.forEach((other) =>
      other.setAttribute("aria-pressed", String(other === button)),
    );
    initializeChallenge();
  });
});

signalSelect.addEventListener("change", () => initializeChallenge());
document.querySelector("#new-challenge").addEventListener("click", () => initializeChallenge(true));
document.querySelector("#mode-trig").addEventListener("click", () => updateMode("trig"));
document.querySelector("#mode-polar").addEventListener("click", () => updateMode("polar"));
answerBody.addEventListener("input", previewAnswers);
answerA0.addEventListener("input", previewAnswers);
document.querySelector("#check-answer").addEventListener("click", () => {
  try {
    const answers = readAnswers();
    const { score, error } = scoreAnswers(answers);
    const roundedScore = Math.round(score);
    document.querySelector("#fourier-score").textContent =
      `Coincidencia: ${score.toFixed(1)} % · error RMS de coeficientes: ${formatCoefficient(error)}`;
    document.querySelector("#fourier-feedback").textContent = score >= 99.5
      ? "¡Correcto! Has encontrado los coeficientes de la serie."
      : score >= 85
        ? "Vas muy bien. Revisa los coeficientes con menor contribución."
        : "Sigue probando: usa la simetría y la forma de la señal como pistas.";
    document.querySelector("#next-challenge").hidden = score < 99.5;
    renderChallenge(answers);
    if (roundedScore === 100) document.querySelector("#fourier-feedback").textContent =
      "¡Correcto! Has encontrado los coeficientes de la serie.";
  } catch (error) {
    document.querySelector("#fourier-feedback").textContent =
      error instanceof SyntaxError
        ? error.message
        : "No se han podido interpretar los coeficientes.";
  }
});
document.querySelector("#show-hint").addEventListener("click", () => {
  const hints = {
    square: "La cuadrada es impar y tiene simetría de media onda: solo aparecen senos en armónicos impares.",
    triangle: "La triangular centrada es par y tiene simetría de media onda: sus cosenos no nulos son impares y decrecen como 1/n².",
    sawtooth: "El diente de sierra es impar: sus coeficientes de coseno son nulos y los senos decrecen como 1/n.",
    sine: "Es un único seno: solo b₁ es distinto de cero.",
    cosine: "Es un único coseno: solo a₁ es distinto de cero.",
    pulse: "El pulso es par y positivo: bₙ = 0, y su componente continua depende del ciclo útil.",
    rectified: "El seno rectificado es par; además, solo tiene armónicos cosenoidales pares y una componente continua positiva.",
    composite: "Es una suma de dos tonos: identifica los dos armónicos no nulos y su tipo de coeficiente.",
  };
  const hint = document.querySelector("#fourier-hint");
  hint.textContent = hints[targetSignal];
  hint.hidden = false;
});
document.querySelector("#show-solution").addEventListener("click", showSolution);
document.querySelector("#next-challenge").addEventListener("click", () => initializeChallenge(true));

initializeChallenge();
