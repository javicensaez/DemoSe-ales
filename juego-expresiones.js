const challenges = [
  {
    title: "Un escalón unitario",
    clue: "Se activa en t = 0 y permanece en 1.",
    hint: "Usa u(t).",
    solution: "u(t)",
    discontinuities: [0],
    target: (t) => (t < 0 ? 0 : 1),
  },
  {
    title: "Un escalón desplazado",
    clue: "La señal pasa de 0 a 1 en t = 1.",
    hint: "Desplaza el argumento del escalón una unidad a la derecha.",
    solution: "u(t-1)",
    discontinuities: [1],
    target: (t) => (t < 1 ? 0 : 1),
  },
  {
    title: "Un pulso rectangular",
    clue: "Vale 1 entre t = −1 y t = 1, y 0 fuera.",
    hint: "Resta dos escalones: uno se activa en −1 y el otro en 1.",
    solution: "u(t+1)-u(t-1)",
    discontinuities: [-1, 1],
    target: (t) => (t < -1 || t >= 1 ? 0 : 1),
  },
  {
    title: "Rampa limitada",
    clue: "Es una rampa x(t) = t entre 0 y 1; fuera de ese tramo vale 0.",
    hint: "Multiplica t por la diferencia de los escalones u(t) y u(t−1).",
    solution: "t*(u(t)-u(t-1))",
    discontinuities: [0, 1],
    target: (t) => (t < 0 || t >= 1 ? 0 : t),
  },
  {
    title: "Pulso triangular",
    clue: "Tiene un pico de altura 1 en t = 0 y se anula en t = ±1.",
    hint: "Multiplica 1−abs(t) por u(t+1)−u(t−1).",
    solution: "(1-abs(t))*(u(t+1)-u(t-1))",
    target: (t) => (Math.abs(t) >= 1 ? 0 : 1 - Math.abs(t)),
  },
  {
    title: "Coseno acotado",
    clue: "Un periodo de cos(2πt) entre t = 0 y t = 1; 0 fuera.",
    hint: "Multiplica cos(2*pi*t) por u(t)−u(t−1).",
    solution: "cos(2*pi*t)*(u(t)-u(t-1))",
    discontinuities: [0, 1],
    target: (t) => (t < 0 || t >= 1 ? 0 : Math.cos(2 * Math.PI * t)),
  },
  {
    title: "Exponencial decreciente",
    clue: "Empieza en 1 cuando t = 0 y decae como e⁻ᵗ para t ≥ 0.",
    hint: "Multiplica exp(-t) por u(t).",
    solution: "exp(-t)*u(t)",
    discontinuities: [0],
    target: (t) => (t < 0 ? 0 : Math.exp(-t)),
  },
  {
    title: "Señal a trozos con rampas",
    clue:
      "Sigue la gráfica: rampa de −1 a 0 entre −2 y −1; nivel 1 hasta 0; nivel 2 hasta 1; y rampa descendente hasta 0 en t = 2.",
    hint: "Escribe cada tramo multiplicado por la ventana que forman dos escalones.",
    solution:
      "(t+1)*(u(t+2)-u(t+1))+(u(t+1)-u(t))+2*(u(t)-u(t-1))+(2-t)*(u(t-1)-u(t-2))",
    discontinuities: [-2, -1, 0, 1, 2],
    timeRange: [-3, 3],
    target: (t) => {
      if (t < -2 || t >= 2) return 0;
      if (t < -1) return t + 1;
      if (t < 0) return 1;
      if (t < 1) return 2;
      return 2 - t;
    },
  },
  {
    title: "Combinación de rampas desplazadas",
    clue:
      "Construye la señal sumando rampas desplazadas que empiezan en t = −3, −2, 0, 2, 3 y 4.",
    hint: "Cada término de la solución tiene la forma (t−a)u(t−a); fíjate en los signos.",
    solution:
      "(t+3)*u(t+3)-(t+2)*u(t+2)-t*u(t)+(t-2)*u(t-2)+(t-3)*u(t-3)-(t-4)*u(t-4)",
    timeRange: [-4, 5],
    target: (t) => {
      if (t < -3) return 0;
      if (t < -2) return t + 3;
      if (t < 0) return 1;
      if (t < 2) return 1 - t;
      if (t < 3) return -1;
      if (t < 4) return t - 4;
      return 0;
    },
  },
  {
    title: "Rampa seguida de un pulso",
    clue:
      "La señal sube linealmente de 0 a 1 entre t = −3 y −2, permanece en 1 hasta t = 0 y después vale 0.",
    hint: "Limita la rampa t+3 al intervalo [−3, −2) y añade un escalón de altura 1 entre −2 y 0.",
    solution: "(t+3)*(u(t+3)-u(t+2))+(u(t+2)-u(t))",
    discontinuities: [-3, -2, 0],
    timeRange: [-6, 3],
    target: (t) => {
      if (t < -3 || t >= 0) return 0;
      if (t < -2) return t + 3;
      return 1;
    },
  },
  {
    title: "Pulso triangular desplazado",
    clue:
      "La señal vale 1 entre t = −2 y −1, desciende linealmente hasta 0 en t = 0, asciende hasta 1 en t = 1 y cae a 0.",
    hint: "Combina escalones y rampas; en t = 1 hay un salto de altura 1.",
    solution: "u(t+2)-t*u(t+1)+2*t*u(t)-2*u(t-1)-(t-1)*u(t-1)",
    discontinuities: [-2, 1],
    timeRange: [-3, 2],
    target: (t) => {
      if (t < -2) return 0;
      if (t < -1) return 1;
      if (t < 0) return 1 - t;
      if (t < 1) return 1 + t;
      return 0;
    },
  },
];

challenges.sort((first, second) => first.solution.length - second.solution.length);

const plotColors = {
  ink: "#164b8c",
  target: "#2878b9",
  answer: "var(--answer)",
  muted: "#526a7c",
  axis: "var(--axis)",
};

const form = document.querySelector("#answer-form");
const expressionInput = document.querySelector("#expression-input");
const comparisonPlot = document.querySelector("#comparison-plot");
const feedback = document.querySelector("#game-feedback");
const hint = document.querySelector("#challenge-hint");
const hintButton = document.querySelector("#hint-button");
const solutionButton = document.querySelector("#solution-button");
const retryButton = document.querySelector("#retry-button");
const nextLevelButton = document.querySelector("#next-level-button");
const previousChallengeButton = document.querySelector("#previous-challenge");
const nextChallengeButton = document.querySelector("#next-challenge");
let challengeIndex = 0;
let answerFunction = null;
let hintShown = false;

class ExpressionParser {
  constructor(source) {
    this.tokens = this.tokenize(source);
    this.position = 0;
  }

  tokenize(source) {
    const tokens = [];
    let position = 0;
    const tokenPattern = /\s*(?:(\d+(?:\.\d*)?|\.\d+)(?:([eE][+-]?\d+))?|([A-Za-z]+)|(.)?)/y;

    while (position < source.length) {
      tokenPattern.lastIndex = position;
      const match = tokenPattern.exec(source);
      if (!match || !match[0].length) {
        throw new Error(`No reconozco la expresión cerca de «${source.slice(position)}».`);
      }
      position = tokenPattern.lastIndex;
      const [whole, decimal, exponent, identifier, symbol] = match;
      if (!whole.trim()) continue;
      if (decimal) tokens.push({ type: "number", value: Number(decimal + (exponent ?? "")) });
      else if (identifier) tokens.push({ type: "identifier", value: identifier.toLowerCase() });
      else if ("+-*/^(),".includes(symbol)) tokens.push({ type: symbol, value: symbol });
      else throw new Error(`El símbolo «${symbol}» no está permitido.`);
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

  expect(type, label = type) {
    if (!this.take(type)) throw new Error(`Falta «${label}» en la expresión.`);
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

  multiplicative() {
    let left = this.unary();
    while (this.peek("*") || this.peek("/")) {
      const operator = this.tokens[this.position++].type;
      const right = this.unary();
      const previous = left;
      left = (t) => (operator === "*" ? previous(t) * right(t) : previous(t) / right(t));
    }
    return left;
  }

  unary() {
    if (this.take("+")) return this.unary();
    if (this.take("-")) {
      const value = this.unary();
      return (t) => -value(t);
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
      this.expect(")", ")");
      return expression;
    }

    const token = this.tokens[this.position++];
    if (token.type === "number") return () => token.value;
    if (token.type !== "identifier") {
      throw new Error("Se esperaba un número, t, una constante o una función.");
    }
    if (token.value === "t") return (t) => t;
    if (token.value === "pi") return () => Math.PI;
    if (token.value === "e") return () => Math.E;

    const functions = {
      u: (value) => (value < 0 ? 0 : 1),
      step: (value) => (value < 0 ? 0 : 1),
      ramp: (value) => Math.max(0, value),
      rect: (value) => (Math.abs(value) < 0.5 ? 1 : 0),
      tri: (value) => Math.max(1 - Math.abs(value), 0),
      abs: (value) => Math.abs(value),
      sin: (value) => Math.sin(value),
      cos: (value) => Math.cos(value),
      exp: (value) => Math.exp(value),
    };
    const apply = functions[token.value];
    if (!apply) throw new Error(`La función «${token.value}» no está permitida.`);
    this.expect("(", "(");
    const argument = this.additive();
    this.expect(")", ")");
    return (t) => apply(argument(t));
  }
}

function formatNumber(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

function plotPath(signal, { color, dashed = false, timeMin = -2, timeMax = 2, yMax = 2 }) {
  const width = 800;
  const height = 360;
  const margin = { top: 24, right: 24, bottom: 42, left: 56 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const toX = (t) => margin.left + ((t - timeMin) / (timeMax - timeMin)) * plotWidth;
  const toY = (value) => margin.top + ((yMax - value) / (2 * yMax)) * plotHeight;
  const points = [];

  for (let index = 0; index <= 600; index += 1) {
    const t = timeMin + ((timeMax - timeMin) * index) / 600;
    const value = signal(t);
    if (!Number.isFinite(value)) {
      points.push(null);
      continue;
    }
    points.push([toX(t), toY(Math.max(-yMax, Math.min(yMax, value)))]);
  }

  const segments = [];
  let current = [];
  points.forEach((point) => {
    if (!point) {
      if (current.length > 1) segments.push(current);
      current = [];
    } else {
      current.push(point);
    }
  });
  if (current.length > 1) segments.push(current);

  const d = segments
    .map((segment) =>
      segment
        .map(
          ([x, y], index) =>
            `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`,
        )
        .join(" "),
    )
    .join(" ");

  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" ${dashed ? 'stroke-dasharray="8 5"' : ""} />`;
}

function renderGrid({ timeMin = -2, timeMax = 2, yMax = 2 } = {}) {
  const width = 800;
  const height = 360;
  const margin = { top: 24, right: 24, bottom: 42, left: 56 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = (t) => margin.left + ((t - timeMin) / (timeMax - timeMin)) * plotWidth;
  const y = (value) => margin.top + ((yMax - value) / (2 * yMax)) * plotHeight;
  const markup = [];

  for (let tick = Math.ceil(timeMin); tick <= timeMax; tick += 1) {
    markup.push(`<line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height - margin.bottom}" />`);
    markup.push(`<text class="plot-tick-label" x="${x(tick)}" y="${height - 15}" text-anchor="middle">${tick}</text>`);
  }
  for (let index = -2; index <= 2; index += 1) {
    const tick = (index / 2) * yMax;
    markup.push(`<line class="${index === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}" />`);
    markup.push(`<text class="plot-tick-label" x="${margin.left - 12}" y="${y(tick) + 4}" text-anchor="end">${formatNumber(tick)}</text>`);
  }
  markup.push(`<text class="plot-axis-label" x="${width - margin.right}" y="${height - 3}" text-anchor="end">t</text>`);
  markup.push(`<text class="plot-axis-label" x="14" y="${margin.top}">x(t)</text>`);
  return markup.join("");
}

function renderTarget() {
  const challenge = challenges[challengeIndex];
  document.querySelector("#challenge-progress").textContent =
    `Reto ${challengeIndex + 1} de ${challenges.length}`;
  previousChallengeButton.disabled = challengeIndex === 0;
  nextChallengeButton.disabled = challengeIndex === challenges.length - 1;
  document.querySelector("#challenge-title").textContent = challenge.title;
  document.querySelector("#challenge-clue").textContent = challenge.clue;
  hint.textContent = challenge.hint;
  hint.hidden = true;
  hintShown = false;
  hintButton.textContent = "Ver pista";
  nextLevelButton.hidden = true;

  renderComparison();
  comparisonPlot.setAttribute(
    "aria-label",
    `Señal objetivo: ${challenge.title}; tu expresión aparecerá superpuesta al comprobarla`,
  );
}

function resetAnswer() {
  answerFunction = null;
  expressionInput.value = "";
  nextLevelButton.hidden = true;
  renderComparison();
  feedback.className = "game-feedback";
  feedback.textContent = "Escribe una expresión y comprueba si coincide con la señal.";
}

function readExpression(source) {
  const normalized = source
    .replaceAll("π", "pi")
    .replaceAll("×", "*")
    .replaceAll("·", "*")
    .replaceAll("−", "-");
  return new ExpressionParser(normalized).parse();
}

function checkExpression(expression) {
  const challenge = challenges[challengeIndex];
  const target = challenge.target;
  const [timeMin, timeMax] = challenge.timeRange ?? [-2, 2];
  const sampleCount = 801;
  let squaredError = 0;
  let maxError = 0;
  let scale = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const t = timeMin + ((timeMax - timeMin) * index) / (sampleCount - 1);
    if (challenge.discontinuities?.some((point) => Math.abs(t - point) < 1e-6)) {
      continue;
    }
    const expected = target(t);
    const actual = expression(t);
    if (!Number.isFinite(actual)) {
      throw new Error("La expresión produce un valor infinito o no definido.");
    }
    const error = Math.abs(expected - actual);
    squaredError += error ** 2;
    maxError = Math.max(maxError, error);
    scale = Math.max(scale, Math.abs(expected));
  }

  const rmse = Math.sqrt(squaredError / sampleCount);
  return {
    correct: rmse <= Math.max(0.025, scale * 0.025) && maxError <= Math.max(0.08, scale * 0.08),
    similarity: Math.max(0, Math.round(100 * (1 - rmse / Math.max(scale, 1)))),
  };
}

function renderAnswer() {
  const challenge = challenges[challengeIndex];
  const [timeMin, timeMax] = challenge.timeRange ?? [-2, 2];
  comparisonPlot.innerHTML = `
    ${renderGrid({ timeMin, timeMax })}
    ${plotPath(challenge.target, { color: plotColors.target, timeMin, timeMax })}
    ${plotPath(answerFunction, { color: plotColors.answer, dashed: true, timeMin, timeMax })}
  `;
  comparisonPlot.setAttribute(
    "aria-label",
    `Señal objetivo y tu expresión superpuestas para el reto ${challengeIndex + 1}`,
  );
}

function renderComparison() {
  const challenge = challenges[challengeIndex];
  const [timeMin, timeMax] = challenge.timeRange ?? [-2, 2];
  comparisonPlot.innerHTML = `
    ${renderGrid({ timeMin, timeMax })}
    ${plotPath(challenge.target, { color: plotColors.target, timeMin, timeMax })}
    ${answerFunction ? plotPath(answerFunction, { color: plotColors.answer, dashed: true, timeMin, timeMax }) : ""}
  `;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const source = expressionInput.value.trim();
  if (!source) {
    feedback.className = "game-feedback is-error";
    feedback.textContent = "Escribe una expresión antes de comprobarla.";
    expressionInput.focus();
    return;
  }

  try {
    answerFunction = readExpression(source);
    const result = checkExpression(answerFunction);
    renderAnswer();
    if (result.correct) {
      nextLevelButton.hidden = challengeIndex === challenges.length - 1;
      feedback.className = "game-feedback is-success";
      feedback.textContent =
        challengeIndex === challenges.length - 1
          ? `¡Correcto! Has completado los ${challenges.length} retos.`
          : `¡Correcto! La señal coincide (similitud ${result.similarity} %).`;
    } else {
      nextLevelButton.hidden = true;
      feedback.className = "game-feedback is-error";
      feedback.textContent = `Aún no coincide (similitud ${result.similarity} %). Compara las curvas y vuelve a intentarlo.`;
    }
  } catch (error) {
    answerFunction = null;
    renderComparison();
    feedback.className = "game-feedback is-error";
    feedback.textContent = error.message;
  }
});

expressionInput.addEventListener("input", () => {
  nextLevelButton.hidden = true;
});

hintButton.addEventListener("click", () => {
  hintShown = !hintShown;
  hint.hidden = !hintShown;
  hintButton.textContent = hintShown ? "Ocultar pista" : "Ver pista";
});

solutionButton.addEventListener("click", () => {
  const solution = challenges[challengeIndex].solution;
  expressionInput.value = solution;
  answerFunction = readExpression(solution);
  renderAnswer();
  feedback.className = "game-feedback";
  feedback.textContent = `Solución: x(t) = ${solution}. Pulsa «Comprobar» para validar la expresión.`;
});

retryButton.addEventListener("click", () => {
  resetAnswer();
  expressionInput.focus();
});

function navigateChallenge(offset) {
  const nextIndex = challengeIndex + offset;
  if (nextIndex < 0 || nextIndex >= challenges.length) return;
  challengeIndex = nextIndex;
  resetAnswer();
  renderTarget();
}

nextLevelButton.addEventListener("click", () => navigateChallenge(1));
previousChallengeButton.addEventListener("click", () => navigateChallenge(-1));
nextChallengeButton.addEventListener("click", () => navigateChallenge(1));

renderTarget();
