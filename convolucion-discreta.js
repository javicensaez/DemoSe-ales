const sequenceForm = document.querySelector("#sequence-form");
const xSequenceInput = document.querySelector("#x-sequence");
const hSequenceInput = document.querySelector("#h-sequence");
const sequenceError = document.querySelector("#sequence-error");
const previousButton = document.querySelector("#previous-step");
const nextButton = document.querySelector("#next-step");
const showResultButton = document.querySelector("#show-result");
const finalResultCard = document.querySelector("#final-result-card");
const finalSequenceDisplay = document.querySelector("#final-sequence");
const overlapPlot = document.querySelector("#discrete-overlap-plot");
const productsBody = document.querySelector("#discrete-products-body");

let xSequence = [1, 2, 1];
let hSequence = [1, -1, 2];
let outputIndex = 0;

function formatNumber(value) {
  return Number(value.toFixed(4)).toLocaleString("es-ES", {
    maximumFractionDigits: 4,
  });
}

function parseSequence(value, label) {
  const tokens = value.split(",").map((token) => token.trim());
  if (tokens.length < 1 || tokens.length > 8 || tokens.some((token) => token === "")) {
    throw new Error(`${label}: introduce entre 1 y 8 valores separados por comas.`);
  }

  const values = tokens.map(Number);
  if (values.some((number) => !Number.isFinite(number) || Math.abs(number) > 100)) {
    throw new Error(`${label}: cada valor debe ser un número entre −100 y 100.`);
  }
  return values;
}

function calculateConvolution() {
  const outputLength = xSequence.length + hSequence.length - 1;
  return Array.from({ length: outputLength }, (_, n) =>
    xSequence.reduce((sum, xValue, k) => {
      const hIndex = n - k;
      return sum + xValue * (hSequence[hIndex] ?? 0);
    }, 0),
  );
}

function renderOverlap() {
  const firstIndex = -hSequence.length + 1;
  const lastIndex = xSequence.length + hSequence.length - 1;
  const indices = Array.from(
    { length: lastIndex - firstIndex + 1 },
    (_, position) => firstIndex + position,
  );
  const maxMagnitude = Math.max(
    1,
    ...xSequence.map(Math.abs),
    ...hSequence.map(Math.abs),
  );
  const outputSequence = calculateConvolution();
  const maxOutputMagnitude = Math.max(1, ...outputSequence.map(Math.abs));
  const maxProductMagnitude = Math.max(1, ...xSequence.map((value, k) => Math.abs(value * (hSequence[outputIndex - k] ?? 0))));
  const productScaleY = 36 / maxProductMagnitude;
  const xBaseline = 75;
  const hBaseline = 175;
  const productBaseline = 275;
  const outputBaseline = 375;
  const scaleY = 36 / maxMagnitude;
  const outputScaleY = 50 / maxOutputMagnitude;
  const plotLeft = 135;
  const plotRight = 750;
  const xPosition = (index) =>
    indices.length === 1
      ? (plotLeft + plotRight) / 2
      : plotLeft + ((index - firstIndex) / (indices.length - 1)) * (plotRight - plotLeft);
  const svgParts = [
    `<title>Secuencias x[k] y h[${outputIndex} − k] alineadas en filas separadas</title>`,
    `<line class="plot-axis-line" x1="${plotLeft - 18}" y1="${xBaseline}" x2="${plotRight + 10}" y2="${xBaseline}" />`,
    `<line class="plot-axis-line" x1="${plotLeft - 18}" y1="${hBaseline}" x2="${plotRight + 10}" y2="${hBaseline}" />`,
    `<line class="plot-axis-line" x1="${plotLeft - 18}" y1="${productBaseline}" x2="${plotRight + 10}" y2="${productBaseline}" />`,
    `<line class="plot-axis-line" x1="${plotLeft - 18}" y1="${outputBaseline}" x2="${plotRight + 10}" y2="${outputBaseline}" />`,
    `<text class="discrete-row-label discrete-x-label" x="8" y="${xBaseline + 4}">x[k]</text>`,
    `<text class="discrete-row-label discrete-h-label" x="8" y="${hBaseline + 4}">h[n−k]</text>`,
    `<text class="discrete-row-label discrete-product-label" x="8" y="${productBaseline + 4}">x[k]·h[n−k]</text>`,
    `<text class="discrete-row-label discrete-output-label" x="8" y="${outputBaseline + 4}">y[n]</text>`,
  ];

  for (const k of indices) {
    const xValue = xSequence[k] ?? 0;
    const hIndex = outputIndex - k;
    const hValue = hSequence[hIndex] ?? 0;
    const x = xPosition(k);
    const xY = xBaseline - xValue * scaleY;
    const hY = hBaseline - hValue * scaleY;
    const product = xValue * hValue;
    const productY = productBaseline - product * productScaleY;
    svgParts.push(
      `<line class="plot-grid-line" x1="${x}" y1="24" x2="${x}" y2="425" />`,
      `<line x1="${x}" y1="${xBaseline}" x2="${x}" y2="${xY}" stroke="var(--answer)" stroke-width="3" />`,
      `<circle cx="${x}" cy="${xY}" r="5" fill="var(--answer)"><title>x[${k}] = ${formatNumber(xValue)}</title></circle>`,
      `<text class="discrete-sample-value discrete-x-value" x="${x}" y="${xY + (xValue < 0 ? 16 : -9)}" text-anchor="middle">${formatNumber(xValue)}</text>`,
      `<line x1="${x}" y1="${hBaseline}" x2="${x}" y2="${hY}" stroke="var(--wave)" stroke-width="3" />`,
      `<circle cx="${x}" cy="${hY}" r="5" fill="var(--wave)"><title>h[${hIndex}] = ${formatNumber(hValue)}</title></circle>`,
      `<text class="discrete-sample-value discrete-h-value" x="${x}" y="${hY + (hValue < 0 ? 16 : -9)}" text-anchor="middle">${formatNumber(hValue)}</text>`,
      `<line x1="${x}" y1="${productBaseline}" x2="${x}" y2="${productY}" stroke="var(--accent)" stroke-width="3" />`,
      `<circle cx="${x}" cy="${productY}" r="5" fill="var(--accent)"><title>x[${k}] · h[${hIndex}] = ${formatNumber(product)}</title></circle>`,
      `<text class="discrete-sample-value" x="${x}" y="${productY + (product < 0 ? 16 : -9)}" text-anchor="middle">${formatNumber(product)}</text>`,
      `<text class="discrete-index-label" x="${x}" y="450" text-anchor="middle">${k}</text>`,
    );
    if (k >= 0 && k <= outputIndex) {
      const outputY = outputBaseline - (outputSequence[k] ?? 0) * outputScaleY;
      svgParts.push(
        `<line x1="${x}" y1="${outputBaseline}" x2="${x}" y2="${outputY}" stroke="var(--highlight)" stroke-width="3" />`,
        `<circle cx="${x}" cy="${outputY}" r="5" fill="var(--highlight)"><title>y[${k}] = ${formatNumber(outputSequence[k] ?? 0)}</title></circle>`,
        `<text class="discrete-output-value" x="${x}" y="${outputY + (outputSequence[k] < 0 ? 16 : -9)}" text-anchor="middle">${formatNumber(outputSequence[k] ?? 0)}</text>`,
      );
    }
  }
  svgParts.push(
    `<text class="discrete-index-label" x="764" y="450" text-anchor="end">k</text>`,
  );
  overlapPlot.innerHTML = svgParts.join("");
  overlapPlot.setAttribute(
    "aria-label",
    `Filas de x[k], h[n menos k], sus productos y resultado y[n]. Las muestras de salida se muestran hasta n igual a ${outputIndex}.`,
  );
}

function renderProducts() {
  const terms = xSequence.map((xValue, k) => {
    const hIndex = outputIndex - k;
    const hValue = hSequence[hIndex] ?? 0;
    return { k, xValue, hIndex, hValue, product: xValue * hValue };
  });
  const result = terms.reduce((sum, term) => sum + term.product, 0);

  productsBody.innerHTML = terms
    .map(
      ({ k, xValue, hIndex, hValue, product }) => `
        <tr>
          <th scope="row">${k}</th>
          <td>${formatNumber(xValue)}</td>
          <td>${hIndex >= 0 && hIndex < hSequence.length ? formatNumber(hValue) : "0"}</td>
          <td>${formatNumber(product)}</td>
        </tr>
      `,
    )
    .join("");
  document.querySelector("#discrete-step-badge").textContent = `n = ${outputIndex}`;
  document.querySelector("#discrete-sum-title").textContent = `Productos para n = ${outputIndex}`;
  document.querySelector("#discrete-sum-value").textContent = formatNumber(result);
  document.querySelector("#discrete-result").textContent =
    `y[${outputIndex}] = ${terms
      .map(({ product }) => formatNumber(product))
      .join(" + ")} = ${formatNumber(result)}`;
}

function renderStep() {
  const maxIndex = xSequence.length + hSequence.length - 1;
  document.querySelector("#step-number").textContent = String(outputIndex + 1);
  document.querySelector("#step-count").textContent = String(maxIndex + 1);
  previousButton.disabled = outputIndex === 0;
  nextButton.disabled = outputIndex === maxIndex;
  renderOverlap();
  renderProducts();
}

sequenceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  let nextXSequence;
  let nextHSequence;
  try {
    nextXSequence = parseSequence(xSequenceInput.value, "x[k]");
    nextHSequence = parseSequence(hSequenceInput.value, "h[k]");
  } catch (error) {
    sequenceError.textContent = error.message;
    sequenceError.hidden = false;
    return;
  }

  xSequence = nextXSequence;
  hSequence = nextHSequence;
  outputIndex = 0;
  finalResultCard.hidden = true;
  finalSequenceDisplay.textContent = "";
  sequenceError.hidden = true;
  sequenceError.textContent = "";
  renderStep();
});

showResultButton.addEventListener("click", () => {
  const result = calculateConvolution();
  finalSequenceDisplay.textContent = `y[n] = [${result.map(formatNumber).join(", ")}]`;
  finalResultCard.hidden = false;
});

previousButton.addEventListener("click", () => {
  if (outputIndex > 0) {
    outputIndex -= 1;
    renderStep();
  }
});

nextButton.addEventListener("click", () => {
  if (outputIndex < xSequence.length + hSequence.length - 1) {
    outputIndex += 1;
    renderStep();
  }
});

renderStep();
