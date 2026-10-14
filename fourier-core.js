(() => {
  const signals = {
    square: {
      name: "Cuadrada bipolar",
      symbol: "±1",
      value: (phase) => (normalizePhase(phase) < 0.5 ? 1 : -1),
      coefficient: (n) => ({ a: 0, b: n % 2 ? 4 / (Math.PI * n) : 0 }),
      a0: 0,
    },
    triangle: {
      name: "Triangular",
      symbol: "△",
      value: (phase) => {
        const p = normalizePhase(phase);
        return 1 - 4 * Math.abs(p - 0.5);
      },
      coefficient: (n) => ({
        a: n % 2 ? -8 / (Math.PI ** 2 * n ** 2) : 0,
        b: 0,
      }),
      a0: 0,
    },
    sawtooth: {
      name: "Diente de sierra",
      symbol: "↗",
      value: (phase) => 2 * normalizePhase(phase) - 1,
      coefficient: (n) => ({ a: 0, b: -2 / (Math.PI * n) }),
      a0: 0,
    },
    sine: {
      name: "Seno",
      symbol: "sin",
      value: (phase) => Math.sin(2 * Math.PI * phase),
      coefficient: (n) => ({ a: 0, b: n === 1 ? 1 : 0 }),
      a0: 0,
    },
    cosine: {
      name: "Coseno",
      symbol: "cos",
      value: (phase) => Math.cos(2 * Math.PI * phase),
      coefficient: (n) => ({ a: n === 1 ? 1 : 0, b: 0 }),
      a0: 0,
    },
    pulse: {
      name: "Pulso rectangular",
      symbol: "rect",
      value: (phase, duty) => {
        const centeredPhase = normalizePhase(phase + 0.5) - 0.5;
        return Math.abs(centeredPhase) < duty / 2 ? 1 : 0;
      },
      coefficient: (n, duty) => ({
        a: (2 * Math.sin(Math.PI * n * duty)) / (Math.PI * n),
        b: 0,
      }),
      a0: (duty) => 2 * duty,
    },
    rectified: {
      name: "Seno rectificado",
      symbol: "|sin|",
      value: (phase) => Math.abs(Math.sin(2 * Math.PI * phase)),
      coefficient: (n) => ({
        a: n % 2 === 0
          ? -4 / (Math.PI * (4 * (n / 2) ** 2 - 1))
          : 0,
        b: 0,
      }),
      a0: 4 / Math.PI,
    },
    composite: {
      name: "Señal compuesta",
      symbol: "sin + cos",
      value: (phase) =>
        0.65 * Math.sin(2 * Math.PI * phase) +
        0.35 * Math.cos(4 * Math.PI * phase),
      coefficient: (n) => ({
        a: n === 2 ? 0.35 : 0,
        b: n === 1 ? 0.65 : 0,
      }),
      a0: 0,
    },
  };

  function normalizePhase(phase) {
    return ((phase % 1) + 1) % 1;
  }

  function coefficients(signalKey, count, duty = 0.25) {
    const signal = signals[signalKey];
    return {
      a0: typeof signal.a0 === "function" ? signal.a0(duty) : signal.a0,
      terms: Array.from({ length: count + 1 }, (_, index) =>
        index === 0 ? { n: 0, a: 0, b: 0 } : {
          n: index,
          ...signal.coefficient(index, duty),
        },
      ),
    };
  }

  function evaluate(signalKey, phase, duty = 0.25) {
    return signals[signalKey].value(phase, duty);
  }

  function sum(coeffs, phase, count = coeffs.terms.length - 1) {
    const angle = 2 * Math.PI * phase;
    let value = coeffs.a0 / 2;
    for (let index = 1; index <= Math.min(count, coeffs.terms.length - 1); index += 1) {
      const term = coeffs.terms[index];
      value += term.a * Math.cos(index * angle) + term.b * Math.sin(index * angle);
    }
    return value;
  }

  function plotMarkup({ curves, xRange, yRange, xTicks, yTicks, sampleCount = 901 }) {
    const width = 800;
    const height = 320;
    const margin = { top: 24, right: 24, bottom: 42, left: 58 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const x = (value) =>
      margin.left + ((value - xRange[0]) / (xRange[1] - xRange[0])) * plotWidth;
    const y = (value) =>
      margin.top + ((yRange[1] - value) / (yRange[1] - yRange[0])) * plotHeight;
    const parts = [];
    const format = (value) => Number(value.toFixed(2)).toString();

    for (const tick of xTicks) {
      parts.push(`
        <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height - margin.bottom}" />
        <text class="plot-tick-label" x="${x(tick)}" y="${height - 14}" text-anchor="middle">${format(tick)}</text>
      `);
    }
    for (const tick of yTicks) {
      parts.push(`
        <line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}" />
        <text class="plot-tick-label" x="${margin.left - 10}" y="${y(tick) + 4}" text-anchor="end">${format(tick)}</text>
      `);
    }

    for (const curve of curves) {
      const points = [];
      for (let index = 0; index < sampleCount; index += 1) {
        const valueX = xRange[0] +
          ((xRange[1] - xRange[0]) * index) / (sampleCount - 1);
        points.push([x(valueX), y(curve.value(valueX))]);
      }
      const path = points
        .map(([pointX, pointY], index) =>
          `${index === 0 ? "M" : "L"}${pointX.toFixed(2)},${pointY.toFixed(2)}`,
        )
        .join(" ");
      parts.push(
        `<path d="${path}" fill="none" stroke="${curve.color}" stroke-width="${curve.width ?? 3}" ${curve.dash ? `stroke-dasharray="${curve.dash}"` : ""} stroke-linecap="round" stroke-linejoin="round" />`,
      );
    }
    parts.push(`
      <text class="plot-axis-label" x="${width - margin.right}" y="${height - 3}" text-anchor="end">t</text>
      <text class="plot-axis-label" x="14" y="${margin.top}">amplitud</text>
    `);
    return parts.join("");
  }

  function spectrumMarkup(coeffs) {
    const width = 800;
    const height = 190;
    const margin = { top: 20, right: 24, bottom: 34, left: 58 };
    const terms = coeffs.terms.slice(1);
    const values = [Math.abs(coeffs.a0 / 2), ...terms.map((term) => Math.hypot(term.a, term.b))];
    const maxValue = Math.max(0.1, ...values);
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const slotWidth = plotWidth / values.length;
    const barWidth = Math.min(28, slotWidth * 0.68);
    const parts = [];

    parts.push(`<line class="plot-axis-line" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" />`);
    for (const [index, value] of values.entries()) {
      const barHeight = (value / maxValue) * plotHeight;
      const x = margin.left + index * slotWidth + (slotWidth - barWidth) / 2;
      const y = height - margin.bottom - barHeight;
      parts.push(`
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="3" fill="${index === 0 ? "#1479bd" : "#2878b9"}" />
        <text class="plot-tick-label" x="${x + barWidth / 2}" y="${height - 12}" text-anchor="middle">${index === 0 ? "0" : index}</text>
        <text class="plot-tick-label" x="${x + barWidth / 2}" y="${Math.max(margin.top + 11, y - 5)}" text-anchor="middle">${Number(value.toFixed(2))}</text>
      `);
    }
    parts.push(`<text class="plot-axis-label" x="${width - margin.right}" y="${height - 2}" text-anchor="end">armónico n</text>`);
    return parts.join("");
  }

  function parseExpression(source) {
    const tokens = source.match(/sqrt|pi|π|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[()+*/^,-]/gi);
    if (!tokens) throw new SyntaxError("Introduce un valor numérico.");
    const normalized = tokens.map((token) => token.toLowerCase());
    const reconstructed = normalized.join("");
    if (reconstructed !== source.toLowerCase().replace(/\s+/g, "")) {
      throw new SyntaxError("Usa solo números, pi, sqrt, paréntesis y operaciones básicas.");
    }
    let position = 0;

    function primary() {
      const token = normalized[position++];
      if (token === undefined) throw new SyntaxError("La expresión está incompleta.");
      if (token === "+") return unary();
      if (token === "-") return -unary();
      if (token === "(") {
        const value = expression();
        if (normalized[position++] !== ")") throw new SyntaxError("Falta un paréntesis de cierre.");
        return value;
      }
      if (token === "sqrt") {
        if (normalized[position++] !== "(") throw new SyntaxError("Escribe sqrt(valor).");
        const value = expression();
        if (normalized[position++] !== ")") throw new SyntaxError("Falta un paréntesis de cierre.");
        if (value < 0) throw new SyntaxError("No se puede calcular la raíz de un número negativo.");
        return Math.sqrt(value);
      }
      if (token === "pi" || token === "π") return Math.PI;
      const value = Number(token);
      if (!Number.isFinite(value)) throw new SyntaxError("El coeficiente debe ser finito.");
      return value;
    }

    function power() {
      const base = primary();
      if (normalized[position] !== "^") return base;
      position += 1;
      return base ** unary();
    }

    function unary() {
      return power();
    }

    function product() {
      let value = unary();
      while (normalized[position] === "*" || normalized[position] === "/") {
        const operator = normalized[position++];
        const next = unary();
        value = operator === "*" ? value * next : value / next;
      }
      return value;
    }

    function expression() {
      let value = product();
      while (normalized[position] === "+" || normalized[position] === "-") {
        const operator = normalized[position++];
        const next = product();
        value = operator === "+" ? value + next : value - next;
      }
      return value;
    }

    const value = expression();
    if (position !== normalized.length || !Number.isFinite(value)) {
      throw new SyntaxError("La expresión no es válida o no produce un número finito.");
    }
    return value;
  }

  window.FourierCore = { signals, coefficients, evaluate, sum, plotMarkup, spectrumMarkup, parseExpression };
})();
