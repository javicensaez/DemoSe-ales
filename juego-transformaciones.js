const sourceSignals = {
  asymmetric: {
    name: "Pulso asimétrico",
    value: (t) => {
      if (t < -2 || t >= 2) return 0;
      if (t < 0) return (t + 2) / 2;
      if (t < 1) return 1;
      return 2 - t;
    },
  },
  ramp: {
    name: "Rampa truncada",
    value: (t) => (t < 0 || t >= 2 ? 0 : t / 2),
  },
  rampWithPlateau: {
    name: "Rampa con tramo constante",
    value: (t) => {
      if (t < -3 || t >= 0) return 0;
      if (t < -2) return t + 3;
      return 1;
    },
  },
  steppedRamp: {
    name: "Rampa con dos niveles",
    min: -1,
    max: 2,
    value: (t) => {
      if (t < -1 || t >= 3) return 0;
      if (t < 0) return t + 1;
      if (t < 1) return 1;
      if (t < 2) return 2;
      return t - 3;
    },
  },
  exponential: {
    name: "Exponencial causal",
    value: (t) => (t < 0 || t >= 4 ? 0 : Math.exp(-t)),
  },
};

const challenges = [
  {
    title: "Un retraso",
    description: "La señal conserva su forma y tamaño, pero aparece más tarde.",
    source: "asymmetric",
    delay: 1.5,
    scale: 1,
    invert: false,
    gain: 1,
    solution: "x(t-1.5)",
  },
  {
    title: "Inversión temporal",
    description: "La señal está reflejada en el tiempo alrededor de t = 0.",
    source: "ramp",
    delay: 0,
    scale: 1,
    invert: true,
    gain: 1,
    solution: "x(-t)",
  },
  {
    title: "Compresión temporal",
    description: "La señal mantiene su origen, pero dura menos que la original.",
    source: "asymmetric",
    delay: 0,
    scale: 2,
    invert: false,
    gain: 1,
    solution: "x(2t)",
  },
  {
    title: "Expansión temporal",
    description: "La señal se ha ensanchado en el tiempo sin cambiar de amplitud.",
    source: "ramp",
    delay: 0,
    scale: 0.5,
    invert: false,
    gain: 1,
    solution: "x(0.5t)",
  },
  {
    title: "Desplazamiento e inversión",
    description: "La señal se ha reflejado y su centro se ha desplazado.",
    source: "exponential",
    delay: 1,
    scale: 1,
    invert: true,
    gain: 1,
    solution: "x(1-t)",
  },
  {
    title: "Transformación combinada",
    description: "Identifica los cambios de amplitud y tiempo.",
    source: "asymmetric",
    delay: -1.5,
    scale: 2,
    invert: true,
    gain: 3,
    solution: "3x(-2t-3)",
  },
  {
    title: "Inversión de amplitud y retraso",
    description: "Dibuja la señal con amplitud negativa y retrasada 2 unidades.",
    source: "rampWithPlateau",
    delay: 2,
    scale: 1,
    invert: false,
    gain: -2,
    solution: "-2x(t-2)",
  },
  {
    title: "Inversión y desplazamiento",
    description: "Invierte la señal en el tiempo y desplázala según la expresión.",
    source: "rampWithPlateau",
    delay: 2,
    scale: 1,
    invert: true,
    gain: 1,
    solution: "x(-t+2)",
  },
  {
    title: "Expansión temporal",
    description: "La señal se expande en el tiempo al doble de su duración.",
    source: "rampWithPlateau",
    delay: 0,
    scale: 0.5,
    invert: false,
    gain: 1,
    solution: "x(t/2)",
  },
  {
    title: "Inversión, compresión y amplitud",
    description: "Combina la inversión temporal, la compresión y el aumento de amplitud.",
    source: "rampWithPlateau",
    delay: 2,
    scale: 2,
    invert: true,
    gain: 3,
    solution: "3x(-2t+4)",
  },
  {
    title: "Inversión de amplitud y retraso",
    description: "Invierte la amplitud y retrasa la señal 2 unidades.",
    source: "steppedRamp",
    delay: 2,
    scale: 1,
    invert: false,
    gain: -2,
    timeRange: [-3, 7],
    solution: "-2x(t-2)",
  },
  {
    title: "Inversión con desplazamiento",
    description: "Invierte la señal en el tiempo y desplázala una unidad.",
    source: "steppedRamp",
    delay: 1,
    scale: 1,
    invert: true,
    gain: 1,
    timeRange: [-4, 4],
    solution: "x(1-t)",
  },
  {
    title: "Compresión y desplazamiento",
    description: "Comprime la señal y desplázala en el tiempo según la expresión.",
    source: "steppedRamp",
    delay: -1,
    scale: 2,
    invert: false,
    gain: 1,
    timeRange: [-4, 3],
    solution: "x(2t+2)",
  },
  {
    title: "Expansión e inversión desplazada",
    description: "Expande la señal por un factor de 3 y aplica inversión y desplazamiento.",
    source: "steppedRamp",
    delay: 6,
    scale: 1 / 3,
    invert: true,
    gain: 1,
    timeRange: [-5, 11],
    solution: "x(2-t/3)",
  },
];

const plotColors = {
  source: "#164b8c",
  target: "#2878b9",
  answer: "var(--answer)",
};
const defaultTimeRange = [-7, 7];
const form = document.querySelector("#transform-form");
const expressionInput = document.querySelector("#transform-expression");
const sourcePlot = document.querySelector("#source-plot");
const targetPlot = document.querySelector("#target-plot");
const feedback = document.querySelector("#transform-feedback");
const previousButton = document.querySelector("#previous-challenge");
const nextButton = document.querySelector("#next-challenge");
const nextLevelButton = document.querySelector("#next-level-button");
let challengeIndex = 0;
let submittedFunction = null;

function transformSignal(source, t, { delay, scale, invert, gain }) {
  const direction = invert ? -1 : 1;
  return gain * source(direction * scale * (t - delay));
}

class TransformExpressionParser {
  constructor(source, sourceSignal) {
    this.sourceSignal = sourceSignal;
    this.tokens = this.tokenize(source);
    this.position = 0;
  }

  tokenize(source) {
    const tokens = [];
    const pattern = /\s*(?:(\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|([A-Za-z]+)|(.)?)/y;
    let position = 0;

    while (position < source.length) {
      pattern.lastIndex = position;
      const match = pattern.exec(source);
      if (!match || !match[0].length) {
        throw new Error(`No reconozco la expresión cerca de «${source.slice(position)}».`);
      }
      position = pattern.lastIndex;
      if (!match[0].trim()) continue;
      if (match[1]) tokens.push({ type: "number", value: Number(match[1]) });
      else if (match[2]) {
        tokens.push({ type: "identifier", value: match[2].toLowerCase() });
      } else if ("+-*/^(),".includes(match[3])) {
        tokens.push({ type: match[3], value: match[3] });
      } else {
        throw new Error(`El símbolo «${match[3]}» no está permitido.`);
      }
    }
    tokens.push({ type: "end", value: "" });
    return tokens;
  }

  peek(type) {
    return this.tokens[this.position].type === type;
  }

  take(type) {
    if (!this.peek(type)) return false;
    this.position += 1;
    return true;
  }

  expect(type) {
    if (!this.take(type)) throw new Error(`Falta «${type}» en la expresión.`);
  }

  parse() {
    const expression = this.additive();
    if (!this.peek("end")) {
      throw new Error(`No esperaba «${this.tokens[this.position].value}».`);
    }
    return expression;
  }

  additive() {
    let left = this.multiplicative();
    while (this.peek("+") || this.peek("-")) {
      const operator = this.tokens[this.position++].type;
      const right = this.multiplicative();
      const previous = left;
      left = (t) => (operator === "+" ? previous(t) + right(t) : previous(t) - right(t));
    }
    return left;
  }

  startsImplicitFactor() {
    return (
      this.peek("number") ||
      this.peek("identifier") ||
      this.peek("(")
    );
  }

  multiplicative() {
    let left = this.unary();
    while (this.peek("*") || this.peek("/") || this.startsImplicitFactor()) {
      const operator = this.peek("*") || this.peek("/") ? this.tokens[this.position++].type : "*";
      const right = this.unary();
      const previous = left;
      left = (t) => (operator === "/" ? previous(t) / right(t) : previous(t) * right(t));
    }
    return left;
  }

  unary() {
    if (this.take("+")) return this.unary();
    if (this.take("-")) {
      const expression = this.unary();
      return (t) => -expression(t);
    }
    return this.power();
  }

  power() {
    let left = this.primary();
    if (this.take("^")) {
      const right = this.unary();
      const previous = left;
      left = (t) => previous(t) ** right(t);
    }
    return left;
  }

  primary() {
    if (this.take("(")) {
      const expression = this.additive();
      this.expect(")");
      return expression;
    }

    const token = this.tokens[this.position++];
    if (token.type === "number") return () => token.value;
    if (token.type !== "identifier") {
      throw new Error("Se esperaba un número, t o x(argumento).");
    }
    if (token.value === "t") return (t) => t;
    if (token.value === "pi") return () => Math.PI;
    if (token.value !== "x") {
      throw new Error(`«${token.value}» no está definido; usa x(argumento) para la señal original.`);
    }

    this.expect("(");
    const argument = this.additive();
    this.expect(")");
    return (t) => this.sourceSignal(argument(t));
  }
}

function gridMarkup(minAmplitude, maxAmplitude, timeRange) {
  const width = 800;
  const height = 360;
  const margin = { top: 24, right: 24, bottom: 42, left: 56 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = (t) =>
    margin.left + ((t - timeRange[0]) / (timeRange[1] - timeRange[0])) * plotWidth;
  const amplitudePadding = (maxAmplitude - minAmplitude) * 0.2 || 1;
  const lowerBound = minAmplitude - amplitudePadding;
  const upperBound = maxAmplitude + amplitudePadding;
  const y = (value) =>
    margin.top + ((upperBound - value) / (upperBound - lowerBound)) * plotHeight;
  const parts = [];

  for (let tick = timeRange[0]; tick <= timeRange[1]; tick += 1) {
    parts.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height - margin.bottom}" />
      <text class="plot-tick-label" x="${x(tick)}" y="${height - 15}" text-anchor="middle">${tick}</text>
    `);
  }
  const amplitudeTicks =
    minAmplitude < 0
      ? [minAmplitude, 0, maxAmplitude]
      : [0, maxAmplitude / 2, maxAmplitude];
  for (const tick of amplitudeTicks) {
    parts.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}" />
      <text class="plot-tick-label" x="${margin.left - 12}" y="${y(tick) + 4}" text-anchor="end">${Number(tick.toFixed(2))}</text>
    `);
  }
  parts.push(`
    <text class="plot-axis-label" x="${width - margin.right}" y="${height - 3}" text-anchor="end">t</text>
    <text class="plot-axis-label" x="14" y="${margin.top}">amplitud</text>
  `);
  return parts.join("");
}

function signalPath(signal, color, minAmplitude, maxAmplitude, timeRange, dashed = false) {
  const width = 800;
  const height = 360;
  const margin = { top: 24, right: 24, bottom: 42, left: 56 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = (t) =>
    margin.left + ((t - timeRange[0]) / (timeRange[1] - timeRange[0])) * plotWidth;
  const amplitudePadding = (maxAmplitude - minAmplitude) * 0.2 || 1;
  const lowerBound = minAmplitude - amplitudePadding;
  const upperBound = maxAmplitude + amplitudePadding;
  const y = (value) =>
    margin.top + ((upperBound - value) / (upperBound - lowerBound)) * plotHeight;
  const points = [];
  const count = 900;

  for (let index = 0; index <= count; index += 1) {
    const t = timeRange[0] + ((timeRange[1] - timeRange[0]) * index) / count;
    const value = signal(t);
    if (!Number.isFinite(value)) {
      points.push(null);
      continue;
    }
    points.push([
      x(t),
      y(Math.max(lowerBound, Math.min(upperBound, value))),
    ]);
  }

  const segments = [];
  let segment = [];
  for (const point of points) {
    if (point) segment.push(point);
    else {
      if (segment.length > 1) segments.push(segment);
      segment = [];
    }
  }
  if (segment.length > 1) segments.push(segment);

  const path = segments
    .map((pointsInSegment) =>
      pointsInSegment
        .map(
          ([pointX, pointY], index) =>
            `${index === 0 ? "M" : "L"}${pointX.toFixed(2)},${pointY.toFixed(2)}`,
        )
        .join(" "),
    )
    .join(" ");
  return `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" ${dashed ? 'stroke-dasharray="8 5"' : ""} />`;
}

function renderPlots() {
  const challenge = challenges[challengeIndex];
  const source = sourceSignals[challenge.source];
  const timeRange = challenge.timeRange ?? defaultTimeRange;
  const expected = (t) => transformSignal(source.value, t, challenge);
  const sourceMin = source.min ?? 0;
  const sourceMax = source.max ?? 1;
  const targetMin = Math.min(sourceMin * challenge.gain, sourceMax * challenge.gain);
  const targetMax = Math.max(sourceMin * challenge.gain, sourceMax * challenge.gain);
  sourcePlot.innerHTML = `${gridMarkup(sourceMin, sourceMax, timeRange)}${signalPath(source.value, plotColors.source, sourceMin, sourceMax, timeRange)}`;
  sourcePlot.setAttribute("aria-label", `Señal de origen: ${source.name}`);

  targetPlot.innerHTML = `
    ${gridMarkup(targetMin, targetMax, timeRange)}
    ${signalPath(expected, plotColors.target, targetMin, targetMax, timeRange)}
    ${submittedFunction ? signalPath(submittedFunction, plotColors.answer, targetMin, targetMax, timeRange, true) : ""}
  `;
  targetPlot.setAttribute(
    "aria-label",
    submittedFunction
      ? "Señal de destino y transformación propuesta superpuestas"
      : "Señal de destino transformada",
  );
}

function renderChallenge() {
  const challenge = challenges[challengeIndex];
  document.querySelector("#challenge-progress").textContent =
    `Reto ${challengeIndex + 1} de ${challenges.length}`;
  document.querySelector("#challenge-title").textContent = challenge.title;
  document.querySelector("#challenge-description").textContent =
    challenge.description;
  document.querySelector("#source-title").textContent =
    sourceSignals[challenge.source].name;
  previousButton.disabled = challengeIndex === 0;
  nextButton.disabled = challengeIndex === challenges.length - 1;
  renderPlots();
}

function parseAnswer(expression) {
  if (!expression.trim()) throw new Error("Escribe una expresión antes de comprobarla.");
  const source = sourceSignals[challenges[challengeIndex].source].value;
  return new TransformExpressionParser(expression, source).parse();
}

function compareAnswer(expression) {
  const challenge = challenges[challengeIndex];
  const source = sourceSignals[challenge.source].value;
  const timeRange = challenge.timeRange ?? defaultTimeRange;
  const expected = (t) => transformSignal(source, t, challenge);
  const sampleCount = 1001;
  let squaredError = 0;
  let scale = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const t = timeRange[0] + ((timeRange[1] - timeRange[0]) * index) / (sampleCount - 1);
    const actual = expression(t);
    if (!Number.isFinite(actual)) {
      throw new Error("La expresión produce un valor infinito o no definido.");
    }
    const expectedValue = expected(t);
    squaredError += (expectedValue - actual) ** 2;
    scale = Math.max(scale, Math.abs(expectedValue));
  }

  const error = Math.sqrt(squaredError / sampleCount);
  return {
    correct: error <= Math.max(0.02, scale * 0.025),
    similarity: Math.max(0, Math.round(100 * (1 - error / Math.max(scale, 1)))),
  };
}

function resetAnswer() {
  expressionInput.value = "";
  submittedFunction = null;
  nextLevelButton.hidden = true;
  feedback.className = "transform-feedback";
  feedback.textContent = "Escribe la expresión de la señal transformada y compruébala.";
  renderPlots();
}

function submitAnswer(expression) {
  submittedFunction = expression;
  renderPlots();
  const result = compareAnswer(expression);
  if (result.correct) {
    nextLevelButton.hidden = challengeIndex === challenges.length - 1;
    feedback.className = "transform-feedback is-success";
    feedback.textContent = `¡Correcto! La expresión coincide con la señal de destino (${result.similarity} %).`;
    return;
  }

  nextLevelButton.hidden = true;
  feedback.className = "transform-feedback is-error";
  feedback.textContent = `Aún no coincide (${result.similarity} %). La curva discontinua muestra tu expresión.`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    submitAnswer(parseAnswer(expressionInput.value));
  } catch (error) {
    submittedFunction = null;
    renderPlots();
    feedback.className = "transform-feedback is-error";
    feedback.textContent = error.message;
  }
});

expressionInput.addEventListener("input", () => {
  nextLevelButton.hidden = true;
});

document.querySelector("#show-solution").addEventListener("click", () => {
  const challenge = challenges[challengeIndex];
  expressionInput.value = challenge.solution;
  submitAnswer(parseAnswer(challenge.solution));
  feedback.textContent = `Solución: y(t) = ${challenge.solution}.`;
});

document.querySelector("#reset-transform").addEventListener("click", resetAnswer);

function navigateChallenge(offset) {
  const nextIndex = challengeIndex + offset;
  if (nextIndex < 0 || nextIndex >= challenges.length) return;
  challengeIndex = nextIndex;
  resetAnswer();
  renderChallenge();
}

nextLevelButton.addEventListener("click", () => navigateChallenge(1));
previousButton.addEventListener("click", () => navigateChallenge(-1));
nextButton.addEventListener("click", () => navigateChallenge(1));

renderChallenge();
