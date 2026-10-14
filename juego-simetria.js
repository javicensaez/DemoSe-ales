const challenges = [
  {
    title: "Escalón desplazado",
    description: "El escalón se activa en t = 1.",
    equation: "x(t) = u(t − 1)",
    value: (t) => (t >= 1 ? 1 : 0),
    evenFormula: "xpar(t) = 1/2 para |t| ≥ 1; 0 para |t| < 1",
    oddFormula: "ximpar(t) = 1/2 para t ≥ 1; −1/2 para t ≤ −1; 0 entre ambos",
  },
  {
    title: "Rampa causal",
    description: "La señal crece linealmente para t ≥ 0 y vale cero para t < 0.",
    equation: "x(t) = t u(t)",
    value: (t) => Math.max(0, t),
    evenFormula: "xpar(t) = |t| / 2",
    oddFormula: "ximpar(t) = t / 2",
  },
  {
    title: "Pulso desplazado",
    description: "Pulso de amplitud 1 entre t = 0 y t = 2.",
    equation: "x(t) = 1 para 0 ≤ t < 2; 0 en otro caso",
    value: (t) => (t >= 0 && t < 2 ? 1 : 0),
    evenFormula: "xpar(t) = 1/2 en −2 < t < 2; 0 fuera",
    oddFormula: "ximpar(t) = 1/2 en 0 < t < 2; −1/2 en −2 < t < 0; 0 fuera",
  },
  {
    title: "Pulso asimétrico",
    description: "Señal por tramos: rampa ascendente, tramo constante y rampa descendente.",
    equation: "x(t) = (t+2)/2 en [−2,0); 1 en [0,1); 2−t en [1,2); 0 fuera",
    value: (t) => {
      if (t < -2 || t >= 2) return 0;
      if (t < 0) return (t + 2) / 2;
      if (t < 1) return 1;
      return 2 - t;
    },
    evenFormula: "xpar(t) = [x(t) + x(−t)] / 2",
    oddFormula: "ximpar(t) = [x(t) − x(−t)] / 2",
  },
];

const colors = {
  source: "#164b8c",
  even: "#2878b9",
  odd: "#d97706",
};
const timeRange = [-4, 4];
const sourcePlot = document.querySelector("#source-plot");
const componentsPlot = document.querySelector("#components-plot");
const solutions = document.querySelector("#parity-solutions");
const nextLevelButton = document.querySelector("#next-level-button");
const feedback = document.querySelector("#self-check-feedback");
let challengeIndex = 0;
let amplitudeLimit = 1;
let amplitudeStep = 1;

function chooseAmplitudeLimit(maximum) {
  const desiredLimit = maximum * 1.08;
  const roughStep = desiredLimit / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  const niceStep =
    normalizedStep <= 1
      ? 1
      : normalizedStep <= 2
        ? 2
        : normalizedStep <= 2.5
          ? 2.5
          : normalizedStep <= 5
            ? 5
            : 10;
  const step = niceStep * magnitude;
  return { limit: Math.ceil(desiredLimit / step) * step, step };
}

function plotMarkup(signals) {
  const width = 800;
  const height = 360;
  const margin = { top: 24, right: 24, bottom: 42, left: 56 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = (t) => margin.left + ((t - timeRange[0]) / (timeRange[1] - timeRange[0])) * plotWidth;
  const y = (value) => margin.top + ((amplitudeLimit - value) / (2 * amplitudeLimit)) * plotHeight;
  const parts = [];

  for (let tick = timeRange[0]; tick <= timeRange[1]; tick += 1) {
    parts.push(`
      <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height - margin.bottom}" />
      <text class="plot-tick-label" x="${x(tick)}" y="${height - 15}" text-anchor="middle">${tick}</text>
    `);
  }
  for (let tick = -amplitudeLimit; tick <= amplitudeLimit + amplitudeStep / 100; tick += amplitudeStep) {
    const roundedTick = Number(tick.toPrecision(6));
    parts.push(`
      <line class="${roundedTick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${margin.left}" y1="${y(roundedTick)}" x2="${width - margin.right}" y2="${y(roundedTick)}" />
      <text class="plot-tick-label" x="${margin.left - 12}" y="${y(roundedTick) + 4}" text-anchor="end">${roundedTick}</text>
    `);
  }

  const count = 1000;
  for (const { signal, color, component } of signals) {
    const points = [];
    for (let index = 0; index <= count; index += 1) {
      const t = timeRange[0] + ((timeRange[1] - timeRange[0]) * index) / count;
      const value = signal(t);
      points.push(`${index === 0 ? "M" : "L"}${x(t).toFixed(2)},${y(Math.max(-amplitudeLimit, Math.min(amplitudeLimit, value))).toFixed(2)}`);
    }
    parts.push(`<path${component ? ` class="parity-${component}-path"` : ""} d="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />`);
  }
  parts.push(`
    <text class="plot-axis-label" x="${width - margin.right}" y="${height - 3}" text-anchor="end">t</text>
    <text class="plot-axis-label" x="14" y="${margin.top}">amplitud</text>
  `);
  return parts.join("");
}

function evenPart(signal, t) {
  return (signal(t) + signal(-t)) / 2;
}

function oddPart(signal, t) {
  return (signal(t) - signal(-t)) / 2;
}

function renderChallenge() {
  const challenge = challenges[challengeIndex];
  const even = (t) => evenPart(challenge.value, t);
  const odd = (t) => oddPart(challenge.value, t);
  let maximum = 0;
  for (let index = 0; index <= 1000; index += 1) {
    const t = timeRange[0] + ((timeRange[1] - timeRange[0]) * index) / 1000;
    maximum = Math.max(maximum, Math.abs(challenge.value(t)), Math.abs(even(t)), Math.abs(odd(t)));
  }
  const amplitudeScale = chooseAmplitudeLimit(maximum || 1);
  amplitudeLimit = amplitudeScale.limit;
  amplitudeStep = amplitudeScale.step;
  document.querySelector("#challenge-progress").textContent =
    `Reto ${challengeIndex + 1} de ${challenges.length}`;
  document.querySelector("#challenge-title").textContent = challenge.title;
  document.querySelector("#challenge-description").textContent =
    `${challenge.description} ${challenge.equation}`;
  document.querySelector("#source-title").textContent = challenge.title;
  document.querySelector("#previous-challenge").disabled = challengeIndex === 0;
  document.querySelector("#next-challenge").disabled =
    challengeIndex === challenges.length - 1;
  sourcePlot.innerHTML = plotMarkup([
    { signal: challenge.value, color: colors.source },
  ]);
  sourcePlot.setAttribute("aria-label", `Señal original: ${challenge.title}`);
  solutions.hidden = true;
  nextLevelButton.hidden = true;
  feedback.textContent =
    "La comprobación es tuya: compara la simetría y los valores de ambas componentes.";
  feedback.className = "parity-feedback";
}

function revealSolution() {
  const challenge = challenges[challengeIndex];
  document.querySelector("#even-formula").textContent = challenge.evenFormula;
  document.querySelector("#odd-formula").textContent = challenge.oddFormula;
  componentsPlot.innerHTML = plotMarkup([
    { signal: (t) => evenPart(challenge.value, t), color: colors.even, component: "even" },
    { signal: (t) => oddPart(challenge.value, t), color: colors.odd, component: "odd" },
  ]);
  componentsPlot.setAttribute(
    "aria-label",
    `Componentes par e impar superpuestas de ${challenge.title}, en la misma escala que la señal original`,
  );
  solutions.hidden = false;
  setComponentView("both");
  nextLevelButton.hidden = true;
  feedback.textContent =
    "La comprobación es tuya: compara la simetría y los valores de ambas componentes.";
  solutions.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setComponentView(view) {
  const showEven = view !== "odd";
  const showOdd = view !== "even";
  componentsPlot.querySelector(".parity-even-path").style.display = showEven ? "" : "none";
  componentsPlot.querySelector(".parity-odd-path").style.display = showOdd ? "" : "none";
  document.querySelectorAll("[data-component-view]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.componentView === view));
  });
}

function navigateChallenge(offset) {
  const nextIndex = challengeIndex + offset;
  if (nextIndex < 0 || nextIndex >= challenges.length) return;
  challengeIndex = nextIndex;
  renderChallenge();
}

document.querySelector("#show-solution").addEventListener("click", revealSolution);
document.querySelectorAll("[data-component-view]").forEach((button) => {
  button.addEventListener("click", () => setComponentView(button.dataset.componentView));
});
document.querySelector("#previous-challenge").addEventListener("click", () => navigateChallenge(-1));
document.querySelector("#next-challenge").addEventListener("click", () => navigateChallenge(1));
document.querySelectorAll("[data-self-check]").forEach((button) => {
  button.addEventListener("click", () => {
    const agrees = button.dataset.selfCheck === "match";
    feedback.textContent = agrees
      ? "¡Bien! Has comprobado tus dibujos. Recuerda que x(t) = xpar(t) + ximpar(t)."
      : "Está bien: revisa cómo se reflejan las señales en t = 0 y vuelve a comparar.";
    feedback.className = `parity-feedback ${agrees ? "is-success" : "is-review"}`;
    nextLevelButton.hidden = challengeIndex === challenges.length - 1;
  });
});
nextLevelButton.addEventListener("click", () => navigateChallenge(1));

renderChallenge();
