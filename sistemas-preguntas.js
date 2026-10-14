const properties = [
  { key: "memory", label: "¿Tiene memoria?", options: ["Sin memoria", "Con memoria"] },
  { key: "causality", label: "¿Es causal?", options: ["Causal", "No causal"] },
  { key: "linearity", label: "¿Es lineal?", options: ["Lineal", "No lineal"] },
  {
    key: "time-invariance",
    label: "¿Es invariante en el tiempo?",
    options: ["Invariante en el tiempo", "Variante en el tiempo"],
  },
  { key: "stability", label: "¿Es estable BIBO?", options: ["Estable", "Inestable"] },
];

const systems = [
  {
    name: "Sistema 1 · Ponderación temporal",
    equation: String.raw`\[y(t)=t\,x(t)\]`,
    answers: {
      memory: ["Sin memoria", "En cada instante, y(t) depende solo de x(t), aunque el factor t cambie con el tiempo."],
      causality: ["Causal", "La salida en t depende de la entrada en ese mismo instante, no de valores futuros."],
      linearity: ["Lineal", "Multiplicar por t conserva la suma y la homogeneidad: el factor depende de t, no de x."],
      "time-invariance": ["Variante en el tiempo", "El factor t hace que desplazar la entrada no produzca simplemente la salida desplazada."],
      stability: ["Inestable", "Con la entrada acotada x(t)=1, la salida y(t)=t no está acotada."],
    },
  },
  {
    name: "Sistema 2 · Escalado temporal",
    equation: String.raw`\[y(t)=x(2t)\]`,
    answers: {
      memory: ["Con memoria", "Salvo en t=0, y(t) consulta la entrada en un instante distinto de t; por ejemplo, y(1)=x(2)."],
      causality: ["No causal", "Para t>0, la salida consulta un valor futuro; por ejemplo, y(1)=x(2)."],
      linearity: ["Lineal", "La evaluación en 2t conserva superposición: a x₁(2t)+b x₂(2t)."],
      "time-invariance": ["Variante en el tiempo", "El escalado temporal hace que desplazar la entrada y desplazar la salida no coincidan."],
      stability: ["Estable", "Si |x(t)|≤M para todo t, entonces también |x(2t)|≤M."],
    },
  },
  {
    name: "Sistema 3 · Retardo con módulo",
    equation: String.raw`\[y(t)=\left|x(t-2)\right|\]`,
    answers: {
      memory: ["Con memoria", "La salida depende de x(t−2), un valor pasado de la entrada."],
      causality: ["Causal", "El instante consultado t−2 siempre es anterior a t."],
      linearity: ["No lineal", "El valor absoluto no respeta escalares negativos: |−x|=|x|, no −|x|."],
      "time-invariance": ["Invariante en el tiempo", "Desplazar la entrada desplaza el argumento dentro del retardo por la misma cantidad."],
      stability: ["Estable", "El valor absoluto no aumenta una cota: |y(t)|=|x(t−2)|≤M."],
    },
  },
  {
    name: "Sistema 4 · Integrador ideal",
    equation: String.raw`\[y(t)=\int_{-\infty}^{t}x(\tau)\,\mathrm{d}\tau\]`,
    answers: {
      memory: ["Con memoria", "La salida acumula valores de la entrada en un intervalo temporal, no solo x(t)."],
      causality: ["Causal", "El límite superior es t: no se utilizan valores de entrada posteriores a t."],
      linearity: ["Lineal", "La integral conserva sumas y multiplicación por escalares."],
      "time-invariance": ["Invariante en el tiempo", "Un desplazamiento temporal de la entrada desplaza en la misma cantidad los límites de acumulación."],
      stability: ["Inestable", "Con x(t)=u(t), la salida es una rampa creciente y no está acotada."],
    },
  },
  {
    name: "Sistema 5 · Inversión temporal y término independiente",
    equation: String.raw`\[y(t)=x(-t)+3\]`,
    answers: {
      memory: ["Con memoria", "Para t≠0, la salida consulta x(−t), en un instante distinto del presente."],
      causality: ["No causal", "Cuando t<0, −t>t y el sistema consulta un valor futuro de la entrada."],
      linearity: ["No lineal", "Con entrada nula la salida vale 3, por lo que no se cumple la condición de linealidad."],
      "time-invariance": ["Variante en el tiempo", "La inversión temporal cambia de forma distinta al desplazar la entrada y la salida."],
      stability: ["Estable", "Si |x(t)|≤M, entonces |y(t)|≤M+3, que sigue siendo una cota finita."],
    },
  },
  {
    name: "Sistema 6 · Integral en ventana futura",
    equation: String.raw`\[y(t)=\int_t^{t+1}x(\tau)\,\mathrm{d}\tau\]`,
    answers: {
      memory: ["Con memoria", "La salida integra los valores de entrada a lo largo de un intervalo de duración uno."],
      causality: ["No causal", "El intervalo incluye instantes τ>t, es decir, valores futuros de la entrada."],
      linearity: ["Lineal", "La integración sobre un intervalo fijo conserva suma y homogeneidad."],
      "time-invariance": ["Invariante en el tiempo", "Al desplazar la entrada, la ventana de integración se desplaza en la misma cantidad."],
      stability: ["Estable", "Si |x(τ)|≤M, la integral sobre una ventana de longitud uno tiene módulo ≤M."],
    },
  },
  {
    name: "Sistema 7 · Componente par",
    equation: String.raw`\[y(t)=\frac{x(t)+x(-t)}{2}\]`,
    answers: {
      memory: ["Con memoria", "La salida utiliza también x(−t), que para t≠0 corresponde a otro instante."],
      causality: ["No causal", "Para t<0, el término x(−t) consulta un valor futuro."],
      linearity: ["Lineal", "Es una combinación lineal de x(t) y x(−t)."],
      "time-invariance": ["Variante en el tiempo", "La inversión temporal x(−t) no conmuta con un desplazamiento arbitrario."],
      stability: ["Estable", "Si la entrada está acotada por M, el promedio de dos valores también queda acotado por M."],
    },
  },
  {
    name: "Sistema 8 · Ecuación diferencial con coeficiente variable",
    equation: String.raw`\[\frac{\mathrm{d}y(t)}{\mathrm{d}t}+2t\,y(t)=x(t)\]`,
    answers: {
      memory: ["Con memoria", "La evolución de y depende del estado previo además de la entrada presente."],
      causality: ["Causal", "La ecuación usa la entrada presente y el estado pasado, sin requerir valores futuros."],
      linearity: ["Lineal", "La derivada y la multiplicación por el coeficiente conocido 2t son operaciones lineales sobre y."],
      "time-invariance": ["Variante en el tiempo", "El coeficiente 2t depende explícitamente del tiempo."],
      stability: ["Estable", "Para t≥0, con estado inicial acotado, e^(−t²) decae y la respuesta a entradas acotadas permanece acotada."],
    },
  },
  {
    name: "Sistema 9 · Modulador de amplitud",
    equation: String.raw`\[y(t)=x(t)\cos(\omega_0t),\qquad \omega_0\ne0\]`,
    answers: {
      memory: ["Sin memoria", "En cada instante solo utiliza x(t) y un factor multiplicativo conocido."],
      causality: ["Causal", "La salida depende de la entrada presente, no de valores futuros."],
      linearity: ["Lineal", "Multiplicar por una función fija del tiempo conserva superposición."],
      "time-invariance": ["Variante en el tiempo", "El coseno permanece ligado al tiempo absoluto y no se desplaza junto con la entrada."],
      stability: ["Estable", "Como |cos(ω₀t)|≤1, una entrada acotada produce una salida acotada."],
    },
  },
  {
    name: "Sistema 10 · Filtro pasa-bajo RC",
    equation: String.raw`\[\frac{\mathrm{d}y(t)}{\mathrm{d}t}+3y(t)=x(t)\]`,
    answers: {
      memory: ["Con memoria", "La salida depende del estado previo y de la evolución acumulada de la entrada."],
      causality: ["Causal", "La ecuación diferencial puede evolucionar desde el estado presente sin conocer el futuro."],
      linearity: ["Lineal", "La derivada y la multiplicación por la constante 3 son operadores lineales."],
      "time-invariance": ["Invariante en el tiempo", "Los coeficientes de la ecuación son constantes."],
      stability: ["Estable", "Su respuesta al impulso es e^(−3t)u(t), cuya integral absoluta vale 1/3."],
    },
  },
];

const progress = document.querySelector("#systems-progress");
const scoreLabel = document.querySelector("#systems-score");
const nameElement = document.querySelector("#system-name");
const equationElement = document.querySelector("#system-equation");
const questionElement = document.querySelector("#systems-question");
const optionsElement = document.querySelector("#systems-options");
const checkButton = document.querySelector("#systems-check");
const nextButton = document.querySelector("#systems-next");
const restartButton = document.querySelector("#systems-restart");
const feedbackElement = document.querySelector("#systems-feedback");

let systemIndex = 0;
let propertyIndex = 0;
let selectedAnswer = "";
let answered = false;
let score = 0;

function renderQuestion() {
  const system = systems[systemIndex];
  const property = properties[propertyIndex];
  window.MathJax?.typesetClear([equationElement]);
  nameElement.textContent = system.name;
  equationElement.textContent = system.equation;
  questionElement.textContent = property.label;
  progress.textContent =
    `Sistema ${systemIndex + 1} de ${systems.length} · Propiedad ${propertyIndex + 1} de ${properties.length}`;
  scoreLabel.textContent = `Aciertos: ${score} / ${systems.length * properties.length}`;
  selectedAnswer = "";
  answered = false;
  checkButton.disabled = true;
  checkButton.hidden = false;
  nextButton.hidden = true;
  restartButton.hidden = true;
  feedbackElement.hidden = true;
  feedbackElement.textContent = "";
  optionsElement.innerHTML = property.options
    .map((option) =>
      `<button class="game-button secondary-game-button systems-option" type="button" aria-pressed="false">${option}</button>`,
    )
    .join("");
  optionsElement.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      if (answered) return;
      selectedAnswer = button.textContent;
      optionsElement.querySelectorAll("button").forEach((option) =>
        option.setAttribute("aria-pressed", String(option === button)),
      );
      checkButton.disabled = false;
    });
  });
  window.MathJax?.typesetPromise([equationElement]);
}

function checkAnswer() {
  if (!selectedAnswer || answered) return;
  answered = true;
  const property = properties[propertyIndex];
  const [answer, explanation] = systems[systemIndex].answers[property.key];
  const correct = selectedAnswer === answer;
  if (correct) score += 1;
  scoreLabel.textContent = `Aciertos: ${score} / ${systems.length * properties.length}`;
  feedbackElement.classList.toggle("is-success", correct);
  feedbackElement.classList.toggle("is-error", !correct);
  feedbackElement.textContent = `${correct ? "¡Correcto!" : `La respuesta es: ${answer}.`} ${explanation}`;
  feedbackElement.hidden = false;
  optionsElement.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
    if (button.textContent === answer) button.classList.add("is-correct");
    else if (button.textContent === selectedAnswer) button.classList.add("is-incorrect");
  });
  checkButton.hidden = true;
  nextButton.hidden = false;
}

function nextQuestion() {
  propertyIndex += 1;
  if (propertyIndex === properties.length) {
    propertyIndex = 0;
    systemIndex += 1;
  }
  if (systemIndex === systems.length) {
    progress.textContent = "Cuestionario completado";
    nameElement.textContent = "¡Has terminado!";
    window.MathJax?.typesetClear([equationElement]);
    equationElement.textContent = "";
    questionElement.textContent =
      `Has acertado ${score} de ${systems.length * properties.length} preguntas.`;
    optionsElement.innerHTML = "";
    feedbackElement.hidden = true;
    nextButton.hidden = true;
    restartButton.hidden = false;
    return;
  }
  renderQuestion();
}

function restartQuiz() {
  systemIndex = 0;
  propertyIndex = 0;
  score = 0;
  renderQuestion();
}

checkButton.addEventListener("click", checkAnswer);
nextButton.addEventListener("click", nextQuestion);
restartButton.addEventListener("click", restartQuiz);
renderQuestion();
