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
challenges.unshift({
  free: true,
  title: "Dibujo libre",
  clue: "Escribe la señal que quieras y pulsa «Dibujar». Puedes sumar términos en varias casillas. No hay señal de referencia ni puntuación. Usa las flechas para pasar a los retos.",
  timeRange: [-4, 4],
});

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
const modeButton = document.querySelector("#expression-mode");
const singleExpression = document.querySelector("#single-expression");
const expressionTerms = document.querySelector("#expression-terms");
const termList = document.querySelector("#term-list");
let multipleTerms = false;
let termId = 0;

function termInputs() {
  return [...termList.querySelectorAll('input[type="text"]')];
}

function invalidateAnswer() {
  answerFunction = null;
  nextLevelButton.hidden = true;
  feedback.className = "game-feedback";
  feedback.textContent = "Respuesta modificada: pulsa el botón para actualizar la gráfica.";
  renderComparison();
}

function renumberTerms() {
  [...termList.children].forEach((row, index) => {
    row.querySelector("label").textContent = `${index === 0 ? "" : "+ "}Término ${index + 1}`;
    row.querySelector(".remove-term").setAttribute("aria-label", `Eliminar término ${index + 1}`);
    row.querySelector(".include-term").setAttribute("aria-label", `Incluir término ${index + 1} en la suma`);
    const toggle = row.querySelector(".toggle-term");
    toggle.textContent = row.preview ? "Ocultar" : "Ver";
    toggle.setAttribute("aria-pressed", String(Boolean(row.preview)));
    toggle.setAttribute("aria-label", `${row.preview ? "Ocultar" : "Ver"} dibujo del término ${index + 1}`);
  });
}

function addTerm(value = "") {
  const row = document.createElement("div");
  row.className = "expression-term";
  const label = document.createElement("label");
  label.className = "expression-label";
  const input = document.createElement("input");
  input.id = `expression-term-${++termId}`;
  input.type = "text";
  input.autocomplete = "off";
  input.setAttribute("autocapitalize", "off");
  input.spellcheck = false;
  input.value = value;
  input.placeholder = "p. ej. -u(t-1)";
  input.setAttribute("aria-describedby", "terms-help expression-help game-feedback");
  label.htmlFor = input.id;
  const entry = document.createElement("div");
  entry.className = "expression-entry";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "game-button remove-term";
  remove.textContent = "Eliminar";
  remove.addEventListener("click", () => {
    const index = termInputs().indexOf(input);
    row.remove();
    if (!termInputs().length) addTerm();
    renumberTerms();
    termInputs()[Math.min(index, termInputs().length - 1)].focus();
    invalidateAnswer();
  });
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "game-button toggle-term";
  toggle.setAttribute("aria-controls", "comparison-plot");
  toggle.addEventListener("click", () => {
    const index = termInputs().indexOf(input);
    if (row.preview) {
      row.preview = null;
    } else {
      try {
        if (!input.value.trim()) throw new Error("Escribe una expresión en esta casilla antes de dibujarla.");
        const expression = readExpression(input.value);
        const [min, max] = challenges[challengeIndex].timeRange ?? [-2, 2];
        for (let sample = 0; sample <= 800; sample += 1) {
          if (!Number.isFinite(expression(min + (max - min) * sample / 800))) {
            throw new Error("La expresión produce un valor infinito o no definido.");
          }
        }
        row.preview = expression;
      } catch (error) {
        feedback.className = "game-feedback is-error";
        feedback.textContent = `Término ${index + 1}: ${error.message}`;
        input.focus();
        return;
      }
    }
    renumberTerms();
    renderComparison();
    feedback.className = "game-feedback";
    feedback.textContent = `Dibujo del término ${index + 1} ${row.preview ? "visible" : "oculto"}. La selección de «Incluir en la suma» se mantiene.`;
  });
  input.addEventListener("input", () => {
    row.preview = null;
    renumberTerms();
    invalidateAnswer();
  });
  entry.append(toggle, input, remove);
  const includeLabel = document.createElement("label");
  includeLabel.className = "term-inclusion";
  const include = document.createElement("input");
  include.type = "checkbox";
  include.className = "include-term";
  include.checked = true;
  include.id = `${input.id}-include`;
  includeLabel.htmlFor = include.id;
  entry.prepend(include);
  includeLabel.textContent = "Incluir en la suma";
  include.addEventListener("change", () => {
    invalidateAnswer();
    feedback.textContent = `Término ${termInputs().indexOf(input) + 1} ${include.checked ? "incluido en" : "excluido de"} la suma. Pulsa «${challenges[challengeIndex].free ? "Dibujar suma" : "Comprobar suma"}» para actualizarla.`;
  });
  row.append(label, entry, includeLabel);
  termList.append(row);
  renumberTerms();
  return input;
}

function summedSource() {
  const inputs = termInputs();
  const source = inputs.filter(input => input.closest(".expression-term").querySelector(".include-term").checked)
    .map(input => input.value.trim()).filter(Boolean)
    .map(value => `(${value})`).join("+");
  return source || (inputs.some(input => input.value.trim()) ? "0" : "");
}

modeButton.addEventListener("click", () => {
  if (!multipleTerms) {
    termList.replaceChildren();
    addTerm(expressionInput.value);
    addTerm();
  } else {
    expressionInput.value = summedSource();
  }
  multipleTerms = !multipleTerms;
  singleExpression.hidden = multipleTerms;
  expressionTerms.hidden = !multipleTerms;
  expressionInput.disabled = multipleTerms;
  modeButton.setAttribute("aria-pressed", String(multipleTerms));
  modeButton.textContent = multipleTerms ? "Usar una sola casilla" : "Usar varias casillas";
  invalidateAnswer();
  (multipleTerms ? termInputs()[0] : expressionInput).focus();
});

document.querySelector("#add-term").addEventListener("click", () => {
  addTerm().focus();
});


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
  const free = Boolean(challenge.free);
  hintButton.hidden = free;
  solutionButton.hidden = free;
  document.querySelector("#challenge-badge").textContent = free ? "Exploración libre" : "Señal objetivo";
  document.querySelector("#comparison-title").textContent = free ? "Tu señal" : "Superposición de señales";
  document.querySelector("#comparison-eyebrow").textContent = free ? "Dibuja tu expresión" : "Comparación en tiempo real";
  document.querySelector("#target-legend").hidden = free;
  document.querySelector("#single-submit").textContent = free ? "Dibujar" : "Comprobar";
  document.querySelector("#terms-submit").textContent = free ? "Dibujar suma" : "Comprobar suma";
  retryButton.textContent = free ? "Borrar dibujo" : "Reintentar reto";
  feedback.textContent = free ? "Escribe una expresión para dibujar tu señal." : "Escribe una expresión y comprueba si coincide con la señal.";
  hint.textContent = challenge.hint ?? "";
  hint.hidden = true;
  hintShown = false;
  hintButton.textContent = "Ver pista";
  nextLevelButton.hidden = true;

  renderComparison();
  comparisonPlot.setAttribute(
    "aria-label",
    challenge.free ? "Gráfica libre de tu expresión, sin señal de referencia" : `Señal objetivo: ${challenge.title}; tu expresión aparecerá superpuesta al comprobarla`,
  );
}

function resetAnswer() {
  answerFunction = null;
  expressionInput.value = "";
  termList.replaceChildren();
  if (multipleTerms) { addTerm(); addTerm(); }
  nextLevelButton.hidden = true;
  renderComparison();
  feedback.className = "game-feedback";
  feedback.textContent = challenges[challengeIndex].free ? "Escribe una expresión para dibujar tu señal." : "Escribe una expresión y comprueba si coincide con la señal.";
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
    const actual = expression(t);
    if (!Number.isFinite(actual)) {
      throw new Error("La expresión produce un valor infinito o no definido.");
    }
    if (challenge.free) continue;
    const expected = target(t);
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
  renderComparison();
  comparisonPlot.setAttribute("aria-label", challenges[challengeIndex].free
    ? "Tu señal dibujada, tiempo en segundos y amplitud x(t)"
    : `Señal objetivo y tu expresión superpuestas para el reto ${challengeIndex + 1}`);
}

function renderComparison() {
  document.querySelector("#clear-sum").disabled = !answerFunction;
  const challenge = challenges[challengeIndex];
  const [timeMin, timeMax] = challenge.timeRange ?? [-2, 2];
  const termColors = ["#7c3aed", "#087f5b", "#b45309", "#be185d", "#0369a1"];
  const previews = multipleTerms ? [...termList.children].flatMap((row, index) =>
    row.preview ? [{ signal: row.preview, index, color: termColors[index % termColors.length] }] : []) : [];
  let yMax = 2;
  const signals = [...previews.map(preview => preview.signal),
    ...(answerFunction ? [answerFunction] : []), ...(challenge.target ? [challenge.target] : [])];
  if (challenge.free || previews.length) {
    for (const signal of signals) {
      for (let index = 0; index <= 800; index += 1) {
        const value = signal(timeMin + (timeMax - timeMin) * index / 800);
        if (Number.isFinite(value)) yMax = Math.max(yMax, Math.abs(value) * 1.1);
      }
    }
    yMax = Math.ceil(yMax);
  }
  comparisonPlot.innerHTML = `
    ${renderGrid({ timeMin, timeMax, yMax })}
    ${challenge.free ? "" : plotPath(challenge.target, { color: plotColors.target, timeMin, timeMax, yMax })}
    ${previews.map(preview => `<g role="img" aria-label="Término ${preview.index + 1}">${plotPath(preview.signal, { color: preview.color, dashed: true, timeMin, timeMax, yMax })}</g>`).join("")}
    ${answerFunction ? plotPath(answerFunction, { color: plotColors.answer, dashed: !challenge.free, timeMin, timeMax, yMax }) : ""}
  `;
  const legend = document.querySelector("#term-legend");
  legend.replaceChildren();
  previews.forEach(preview => {
    const item = document.createElement("span");
    item.className = "legend-item";
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = preview.color;
    swatch.setAttribute("aria-hidden", "true");
    item.append(swatch, `Término ${preview.index + 1}`);
    legend.append(item);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const source = multipleTerms ? summedSource() : expressionInput.value.trim();
  if (!source) {
    feedback.className = "game-feedback is-error";
    feedback.textContent = "Escribe una expresión antes de comprobarla.";
    (multipleTerms ? termInputs()[0] : expressionInput).focus();
    return;
  }

  try {
    nextLevelButton.hidden = true;
    if (multipleTerms) {
      termInputs().forEach((input, index) => {
        if (!input.value.trim() || !input.closest(".expression-term").querySelector(".include-term").checked) return;
        try { readExpression(input.value); }
        catch (error) {
          input.focus();
          throw new Error(`Término ${index + 1}: ${error.message}`);
        }
      });
    }
    answerFunction = readExpression(source);
    const result = checkExpression(answerFunction);
    renderAnswer();
    if (challenges[challengeIndex].free) {
      feedback.className = "game-feedback";
      feedback.textContent = "Señal dibujada. Cambia la expresión para seguir explorando o pasa al siguiente reto con la flecha →.";
      return;
    }
    if (result.correct) {
      nextLevelButton.hidden = challengeIndex === challenges.length - 1;
      feedback.className = "game-feedback is-success";
      feedback.textContent =
        challengeIndex === challenges.length - 1
          ? `¡Correcto! Has completado los ${challenges.length - 1} retos.`
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

document.querySelector("#clear-sum").addEventListener("click", () => {
  invalidateAnswer();
  feedback.textContent = "Gráfica de la suma borrada. Los términos visibles y las casillas se conservan. Pulsa el botón de la suma para dibujarla de nuevo.";
});

expressionInput.addEventListener("input", invalidateAnswer);

hintButton.addEventListener("click", () => {
  hintShown = !hintShown;
  hint.hidden = !hintShown;
  hintButton.textContent = hintShown ? "Ocultar pista" : "Ver pista";
});

solutionButton.addEventListener("click", () => {
  if (challenges[challengeIndex].free) return;
  const solution = challenges[challengeIndex].solution;
  expressionInput.value = solution;
  if (multipleTerms) {
    termList.replaceChildren();
    addTerm(solution);
    addTerm();
  }
  nextLevelButton.hidden = true;
  answerFunction = readExpression(solution);
  renderAnswer();
  feedback.className = "game-feedback";
  feedback.textContent = `Solución: x(t) = ${solution}. Pulsa «Comprobar» para validar la expresión.`;
});

retryButton.addEventListener("click", () => {
  resetAnswer();
  (multipleTerms ? termInputs()[0] : expressionInput).focus();
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
