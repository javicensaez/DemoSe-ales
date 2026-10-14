const signalDefinitions = [
  {
    id: "impulse",
    name: "Delta de Dirac",
    symbol: "δ(t)",
    equation: "x(t) = A δ(t − t₀)",
    description:
      "Impulso ideal en t₀. La flecha representa su peso: el área del impulso es A; su altura no es finita.",
    frequency: false,
    width: false,
    value: () => 0,
  },
  {
    id: "step",
    name: "Escalón unitario",
    symbol: "u(t)",
    equation: "x(t) = A u(t − t₀)",
    description:
      "Vale cero antes de t₀ y A después. En esta convención, u(0) = 1/2.",
    frequency: false,
    width: false,
    value: (time, { amplitude, shift }) =>
      time < shift ? 0 : time > shift ? amplitude : amplitude / 2,
  },
  {
    id: "pulse",
    name: "Pulso rectangular",
    symbol: "rect(t)",
    equation: "x(t) = A rect((t − t₀) / T)",
    description:
      "Pulso centrado en t₀, de amplitud A y anchura T. Fuera del intervalo, su valor es cero.",
    frequency: false,
    width: true,
    value: (time, { amplitude, shift, width }) =>
      Math.abs(time - shift) < width / 2 ? amplitude : 0,
  },
  {
    id: "triangle",
    name: "Triangular",
    symbol: "tri(t)",
    equation: "x(t) = (2A / π) asin(sin(2πf(t − t₀)))",
    description:
      "Onda triangular periódica y simétrica, entre −A y A. El parámetro f controla su frecuencia.",
    frequency: true,
    width: false,
    value: (time, { amplitude, shift, frequency }) =>
      (2 * amplitude / Math.PI) *
      Math.asin(Math.sin(2 * Math.PI * frequency * (time - shift))),
  },
  {
    id: "cosine",
    name: "Coseno",
    symbol: "cos",
    equation: "x(t) = A cos(2πf(t − t₀))",
    description:
      "Señal periódica que empieza en su máximo cuando t = t₀. Su periodo es T = 1/f.",
    frequency: true,
    width: false,
    value: (time, { amplitude, shift, frequency }) =>
      amplitude * Math.cos(2 * Math.PI * frequency * (time - shift)),
  },
  {
    id: "sine",
    name: "Seno",
    symbol: "sin",
    equation: "x(t) = A sin(2πf(t − t₀))",
    description:
      "Señal periódica que cruza cero en t₀ creciendo. Su periodo es T = 1/f.",
    frequency: true,
    width: false,
    value: (time, { amplitude, shift, frequency }) =>
      amplitude * Math.sin(2 * Math.PI * frequency * (time - shift)),
  },
  {
    id: "sinc",
    name: "Sinc",
    symbol: "sinc(t)",
    equation: "x(t) = A sinc(f(t − t₀)),  sinc(u) = sin(πu) / (πu)",
    description:
      "Pulso sinc centrado en t₀. En el centro vale A; sus lóbulos oscilan y decrecen a ambos lados. El parámetro f controla su anchura.",
    frequency: true,
    width: false,
    value: (time, { amplitude, shift, frequency }) => {
      const argument = frequency * (time - shift);
      return Math.abs(argument) < 1e-10
        ? amplitude
        : amplitude * Math.sin(Math.PI * argument) / (Math.PI * argument);
    },
  },
  {
    id: "complex",
    name: "Exponencial compleja",
    symbol: "eʲᵠ",
    equation: "x(t) = A eʲ²πᶠ⁽ᵗ⁻ᵗ⁰⁾ = A cos(2πf(t − t₀)) + jA sin(2πf(t − t₀))",
    description:
      "Tiene módulo constante A. Se muestran por separado sus partes real e imaginaria.",
    frequency: true,
    width: false,
    value: (time, { amplitude, shift, frequency }) =>
      amplitude * Math.cos(2 * Math.PI * frequency * (time - shift)),
  },
];

const colors = {
  ink: "#164b8c",
  wave: "#1479bd",
  accent: "#2878b9",
  muted: "#526a7c",
  line: "#c4d4e0",
  surface: "#f8fbfd",
};

const picker = document.querySelector("#signal-picker");
const amplitude = document.querySelector("#amplitude");
const shift = document.querySelector("#shift");
const frequency = document.querySelector("#frequency");
const width = document.querySelector("#width");
const plot = document.querySelector("#time-plot");
const complexPlot = document.querySelector("#complex-plot");
const complexCard = document.querySelector("#complex-card");
let selectedSignal = signalDefinitions.find((signal) => signal.id === "sine");

function parameters() {
  return {
    amplitude: Number(amplitude.value),
    shift: Number(shift.value),
    frequency: Number(frequency.value),
    width: Number(width.value),
  };
}

function formatNumber(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

function createPicker() {
  picker.innerHTML = signalDefinitions
    .map(
      (signal) => `
        <button class="signal-option" type="button" data-signal="${signal.id}" aria-pressed="${signal.id === selectedSignal.id}">
          <span class="signal-option-symbol" aria-hidden="true">${signal.symbol}</span>
          <span>${signal.name}</span>
        </button>
      `,
    )
    .join("");

  picker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-signal]");
    if (!button) return;

    selectedSignal = signalDefinitions.find(
      (signal) => signal.id === button.dataset.signal,
    );
    render();
  });
}

function svgPath(points) {
  return points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`,
    )
    .join(" ");
}

function renderPlot() {
  const widthPx = 800;
  const heightPx = 360;
  const margin = { top: 25, right: 24, bottom: 42, left: 56 };
  const plotWidth = widthPx - margin.left - margin.right;
  const plotHeight = heightPx - margin.top - margin.bottom;
  const values = parameters();
  const timeMin = -2;
  const timeMax = 2;
  const yMax = Math.max(1.25, values.amplitude * 1.25);
  const x = (time) =>
    margin.left + ((time - timeMin) / (timeMax - timeMin)) * plotWidth;
  const y = (value) =>
    margin.top + ((yMax - value) / (2 * yMax)) * plotHeight;
  const xTicks = [-2, -1, 0, 1, 2];
  const yTicks = [-values.amplitude, 0, values.amplitude];

  const grid = [
    ...xTicks.map(
      (tick) => `
        <line class="plot-grid-line" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${margin.top + plotHeight}" />
        <text class="plot-tick-label" x="${x(tick)}" y="${heightPx - 15}" text-anchor="middle">${tick}</text>`,
    ),
    ...yTicks.map(
      (tick) => `
        <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${margin.left}" y1="${y(tick)}" x2="${widthPx - margin.right}" y2="${y(tick)}" />
        <text class="plot-tick-label" x="${margin.left - 12}" y="${y(tick) + 4}" text-anchor="end">${formatNumber(tick)}</text>`,
    ),
  ].join("");

  let signalMarkup = "";
  if (selectedSignal.id === "impulse") {
    const impulseX = x(values.shift);
    const topY = y(values.amplitude);
    signalMarkup = `
      <line class="signal-line" x1="${impulseX}" y1="${y(0)}" x2="${impulseX}" y2="${topY}" />
      <path class="signal-line" d="M${impulseX - 7},${topY + 10} L${impulseX},${topY} L${impulseX + 7},${topY + 10}" />
      <text class="plot-annotation" x="${impulseX + 12}" y="${topY + 2}">A = ${formatNumber(values.amplitude)}</text>`;
  } else if (selectedSignal.id === "step") {
    const stepX = x(values.shift);
    signalMarkup = `
      <path class="signal-line" d="M${x(timeMin)},${y(0)} H${stepX} V${y(values.amplitude)} H${x(timeMax)}" />
      <circle class="jump-point" cx="${stepX}" cy="${y(0)}" r="4" />
      <circle class="jump-point" cx="${stepX}" cy="${y(values.amplitude)}" r="4" />
      <circle class="jump-point jump-point-filled" cx="${stepX}" cy="${y(values.amplitude / 2)}" r="3" />`;
  } else if (selectedSignal.id === "pulse") {
    const start = values.shift - values.width / 2;
    const end = values.shift + values.width / 2;
    signalMarkup = `
      <path class="signal-line" d="M${x(timeMin)},${y(0)} H${x(start)} V${y(values.amplitude)} H${x(end)} V${y(0)} H${x(timeMax)}" />
      <circle class="jump-point" cx="${x(start)}" cy="${y(values.amplitude)}" r="4" />
      <circle class="jump-point" cx="${x(end)}" cy="${y(values.amplitude)}" r="4" />`;
  } else if (selectedSignal.id === "complex") {
    const realPoints = [];
    const imaginaryPoints = [];
    for (let index = 0; index <= 600; index += 1) {
      const time = timeMin + ((timeMax - timeMin) * index) / 600;
      const phase =
        2 * Math.PI * values.frequency * (time - values.shift);
      realPoints.push([x(time), y(values.amplitude * Math.cos(phase))]);
      imaginaryPoints.push([x(time), y(values.amplitude * Math.sin(phase))]);
    }
    signalMarkup = `
      <path class="signal-line" d="${svgPath(realPoints)}" />
      <path class="signal-line signal-line-secondary" d="${svgPath(imaginaryPoints)}" />`;
  } else {
    const points = [];
    for (let index = 0; index <= 600; index += 1) {
      const time = timeMin + ((timeMax - timeMin) * index) / 600;
      points.push([x(time), y(selectedSignal.value(time, values))]);
    }
    signalMarkup = `<path class="signal-line" d="${svgPath(points)}" />`;
  }

  plot.innerHTML = `
    <text class="plot-axis-label" x="${widthPx - margin.right}" y="${heightPx - 3}" text-anchor="end">t (s)</text>
    <text class="plot-axis-label" x="14" y="${margin.top}" text-anchor="start">x(t)</text>
    ${grid}
    ${signalMarkup}
  `;
  plot.setAttribute(
    "aria-label",
    `Gráfica de ${selectedSignal.name}, entre menos dos y dos segundos`,
  );

  const legendItems =
    selectedSignal.id === "complex"
      ? [
          ["", "Parte real"],
          ["secondary", "Parte imaginaria"],
        ]
      : [["", selectedSignal.name]];
  document.querySelector("#plot-legend").innerHTML = legendItems
    .map(
      ([style, label]) => `
        <span class="legend-item">
          <span class="legend-swatch ${style}"></span>${label}
        </span>`,
    )
    .join("");
}

function renderComplexPlane() {
  if (selectedSignal.id !== "complex") return;

  const values = parameters();
  const center = { x: 180, y: 145 };
  const radius = 94;
  const real = values.amplitude * Math.cos(-2 * Math.PI * values.frequency * values.shift);
  const imaginary = values.amplitude * Math.sin(-2 * Math.PI * values.frequency * values.shift);
  const tip = {
    x: center.x + (real / values.amplitude) * radius,
    y: center.y - (imaginary / values.amplitude) * radius,
  };
  const points = [];

  for (let index = 0; index <= 240; index += 1) {
    const angle = (2 * Math.PI * index) / 240;
    points.push([
      center.x + Math.cos(angle) * radius,
      center.y - Math.sin(angle) * radius,
    ]);
  }

  complexPlot.innerHTML = `
    <line class="complex-axis" x1="35" y1="${center.y}" x2="325" y2="${center.y}" />
    <line class="complex-axis" x1="${center.x}" y1="24" x2="${center.x}" y2="266" />
    <path class="complex-circle" d="${svgPath(points)} Z" />
    <line class="phasor-line" x1="${center.x}" y1="${center.y}" x2="${tip.x}" y2="${tip.y}" />
    <circle class="phasor-tip" cx="${tip.x}" cy="${tip.y}" r="6" />
    <text class="complex-label" x="318" y="${center.y - 10}" text-anchor="end">Re</text>
    <text class="complex-label" x="${center.x + 12}" y="30">Im</text>
    <text class="complex-label" x="${center.x + 8}" y="${center.y + 18}">0</text>
    <text class="complex-label" x="${center.x + 10}" y="${center.y - radius - 8}">A</text>
  `;
  complexPlot.setAttribute(
    "aria-label",
    `Fasor de amplitud ${formatNumber(values.amplitude)} en el plano complejo`,
  );
}

function render() {
  const values = parameters();
  picker.querySelectorAll("[data-signal]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.signal === selectedSignal.id),
    );
  });

  document.querySelector("#signal-title").textContent = selectedSignal.name;
  document.querySelector("#signal-symbol").textContent = selectedSignal.symbol;
  document.querySelector("#signal-equation").textContent =
    selectedSignal.equation;
  document.querySelector("#signal-description").textContent =
    selectedSignal.description;
  document.querySelector("#amplitude-value").textContent =
    formatNumber(values.amplitude);
  document.querySelector("#shift-value").textContent =
    `${formatNumber(values.shift)} s`;
  document.querySelector("#frequency-value").textContent =
    `${formatNumber(values.frequency)} Hz`;
  document.querySelector("#width-value").textContent =
    `${formatNumber(values.width)} s`;
  document.querySelector("#frequency-control").hidden =
    !selectedSignal.frequency;
  document.querySelector("#width-control").hidden = !selectedSignal.width;
  document.querySelector("#parameter-note").textContent =
    selectedSignal.id === "impulse"
      ? "El área del impulso es A, independientemente de cómo se dibuje."
      : selectedSignal.id === "complex"
        ? "El fasor muestra x(0); usa t₀ para cambiar su fase."
        : "El eje temporal muestra de −2 s a 2 s.";
  complexCard.hidden = selectedSignal.id !== "complex";
  renderPlot();
  renderComplexPlane();
}

createPicker();
document
  .querySelectorAll("#amplitude, #shift, #frequency, #width")
  .forEach((input) => input.addEventListener("input", render));
render();
