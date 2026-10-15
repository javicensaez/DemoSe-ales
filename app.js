const demos = [
  {
    category: "Señales básicas",
    title: "Señales básicas",
    description:
      "Explora la delta de Dirac, el escalón, pulsos, ondas periódicas y la exponencial compleja.",
    href: "senales-basicas.html",
    topics: ["senales"],
  },
  {
    category: "Juego · Exprésalo",
    title: "Adivina la expresión",
    description:
      "Observa una señal, escribe su expresión con escalones y funciones básicas y comprueba tu respuesta en la gráfica.",
    href: "juego-expresiones.html",
    topics: ["senales"],
  },
  {
    category: "Juego · Transformaciones",
    title: "Transforma la señal",
    description:
      "Compara una señal de origen con su versión transformada y averigua su retraso, inversión temporal y escalado.",
    href: "juego-transformaciones.html",
    topics: ["senales"],
  },
  {
    category: "Juego · Simetría",
    title: "Señales pares e impares",
    description:
      "Dibuja en tu cuaderno las partes par e impar de una señal, revela la solución y comprueba tus dibujos.",
    href: "juego-simetria.html",
    topics: ["senales"],
  },
  {
    category: "Demo · Valores medios y eficaces",
    title: "Potencia y valores de señales periódicas",
    description:
      "Compara cinco señales periódicas y consulta su valor medio, potencia media, valor eficaz y valor eficaz de alterna.",
    href: "potencia-senales-periodicas.html",
    topics: ["senales"],
  },
  {
    category: "Juego · Valores medios y eficaces",
    title: "Calcula el valor medio y la potencia",
    description:
      "Resuelve retos de valor medio, potencia media y tensión RMS total, de continua (DC) y de alterna (AC).",
    href: "juego-potencias.html",
    topics: ["senales"],
  },
  {
    category: "Juego · Sistemas",
    title: "Preguntas de sistemas",
    description:
      "Clasifica diez sistemas según memoria, causalidad, linealidad, invariancia temporal y estabilidad BIBO.",
    href: "sistemas-preguntas.html",
    topics: ["sistemas"],
  },
  {
    category: "Demo · Operaciones con señales",
    title: "Convolución continua paso a paso",
    description:
      "Elige x(t) y h(t), desplaza una señal con el deslizador y observa el producto y la integral de convolución.",
    href: "convolucion.html",
    topics: ["senales", "sistemas"],
  },
  {
    category: "Demo · Sistemas",
    title: "Circuito RC / CR",
    description:
      "Elige un circuito RC o CR, varía R y C y observa su salida ante un escalón o una señal cuadrada con ciclo de trabajo ajustable.",
    href: "circuito-rc.html",
    topics: ["sistemas", "laplace"],
  },
  {
    category: "Demo · Sistemas",
    title: "Circuito RLC",
    description:
      "Elige R, L y C de un RLC serie con salida en el condensador, observa la respuesta al escalón y el diagrama de polos y ceros.",
    href: "circuito-rlc.html",
    topics: ["sistemas", "laplace"],
  },
  {
    category: "Demo · Sistemas",
    title: "Sistema de segundo orden",
    description:
      "Varía el factor de amortiguamiento y la frecuencia natural y observa la respuesta al escalón y el diagrama de polos y ceros.",
    href: "segundo-orden.html",
    topics: ["sistemas", "laplace"],
  },
  {
    category: "Demo · Sistemas",
    title: "Simplificación de diagramas de bloques",
    description: "Elige entre cinco ejemplos y simplifica sus diagramas con reglas, comparaciones visuales y álgebra paso a paso.",
    href: "diagrama-bloques.html",
    topics: ["sistemas", "laplace"],
  },
  {
    category: "Demo · Transformada de Laplace",
    title: "Laplace y región de convergencia",
    description: "Selecciona señales causales, anticausales y bilaterales y relaciona su expresión de Laplace con los polos y la ROC.",
    href: "laplace.html",
    topics: ["senales", "sistemas", "laplace"],
  },
  {
    category: "Demo · Respuesta en frecuencia",
    title: "Diagrama de Bode",
    description: "Elige entre nueve sistemas y explora magnitud, fase, polos, ceros, amortiguamiento y retardo con un cursor de frecuencia.",
    href: "bode.html",
    topics: ["sistemas", "laplace", "fourier"],
  },
  {
    category: "Juego · Sistemas",
    title: "Adivina H(s)",
    description:
      "Identifica sistemas de primer o segundo orden a partir del escalón, completa H(s) y compara tu respuesta con la original.",
    href: "juego-respuesta-escalon.html",
    topics: ["sistemas", "laplace"],
  },
  {
    category: "Demo · Operaciones con señales",
    title: "Convolución discreta paso a paso",
    description:
      "Introduce secuencias cortas y desplaza una sobre la otra para ver cada producto y la suma de convolución.",
    href: "convolucion-discreta.html",
    topics: ["senales", "sistemas"],
  },
  {
    category: "Demo · Muestreo",
    title: "Muestreo y aliasing",
    description:
      "Ajusta la frecuencia de muestreo, visualiza las muestras y compara la señal original con su reconstrucción.",
    href: "muestreo.html",
    topics: ["senales", "fourier"],
  },
  {
    category: "Demo · Muestreo",
    title: "Muestreo y aliasing en frecuencia",
    description: "Varía la frecuencia de muestreo y observa las réplicas de un espectro triangular y su solapamiento.",
    href: "muestreo-espectro.html",
    topics: ["senales", "fourier"],
  },
  {
    category: "Demo · Conversión analógica-digital",
    title: "Resolución ADC y ENOB",
    description:
      "Calcula el LSB, el ruido de cuantificación y el SNR ideal, o estima los bits efectivos a partir del SINAD medido.",
    href: "adc-enob.html",
    topics: ["senales", "sistemas", "fourier"],
  },
  {
    category: "Demo · Detección de señales",
    title: "Detección de señales con ruido",
    description:
      "Transmite bits con distintos pulsos, añade ruido y explora cómo la correlación cruzada permite detectar la secuencia recibida.",
    href: "correlacion-ruido.html",
    topics: ["senales", "sistemas"],
  },
  {
    category: "Demo · Detección de señales",
    title: "Simulador de sonar",
    description:
      "Emite un chirp, ajusta la posición y tamaño de una persona y estima su distancia mediante la correlación del eco con ruido.",
    href: "sonar.html",
    topics: ["senales", "sistemas"],
  },
  {
    category: "Demo · Análisis espectral",
    title: "FFT de dos sinusoides",
    description: "Ajusta dos frecuencias y amplitudes, el número de muestras y la ventana para explorar resolución y fuga espectral.",
    href: "fft.html",
    topics: ["senales", "fourier"],
  },
  {
    category: "Demo · Análisis tiempo-frecuencia",
    title: "Laboratorio de espectrogramas",
    description: "Explora siete señales con audio, incluido DTMF, y cambia ventana, tamaño y solapamiento para comparar resolución temporal y frecuencial.",
    href: "espectrograma.html",
    topics: ["senales", "fourier"],
  },
  {
    category: "Demo · Análisis de señales",
    title: "Rueda desequilibrada y FFT",
    description:
      "Simula un motor DC con reductora y carga desequilibrada, captura su encoder Hall y analiza la FFT de sus canales y de la señal compleja.",
    href: "rueda-fft.html",
    topics: ["senales", "fourier"],
  },
  {
    category: "Demo · Transformada de Fourier",
    title: "Transformada de Fourier",
    description: "Elige señales típicas, observa tiempo, módulo y fase y explora retraso, escalado e inversión temporal.",
    href: "transformada-fourier.html",
    topics: ["senales", "fourier"],
  },
  {
    category: "Juego · Transformada de Fourier",
    title: "Adivina la transformada de Fourier",
    description: "Escribe la transformada de pulsos y un triángulo y compara la reconstrucción temporal de tu expresión con el objetivo.",
    href: "juego-transformada-fourier.html",
    topics: ["senales", "fourier"],
  },
  {
    category: "Demo · Series de Fourier",
    title: "Laboratorio de series de Fourier",
    description:
      "Explora la síntesis de señales periódicas, sus coeficientes y el espectro al variar el número de armónicos.",
    href: "series-fourier.html",
    topics: ["senales", "series", "fourier"],
  },
  {
    category: "Demo · Series de Fourier",
    title: "Fourier en el plano XY",
    description: "Introduce los coeficientes exponenciales de X e Y y anima figuras como el corazón, una flor o una figura de ocho.",
    href: "fourier-xy.html",
    topics: ["senales", "series", "fourier"],
  },
  {
    category: "Juego · Series de Fourier",
    title: "Desafío de Fourier",
    description:
      "Calcula coeficientes en forma trigonométrica o módulo/fase, reconstruye señales y comprueba tu puntuación.",
    href: "juego-fourier.html",
    topics: ["senales", "series", "fourier"],
  },
];

const demoGrid = document.querySelector("#demo-grid");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

const topicLabels = {
  senales: "Señales",
  sistemas: "Sistemas",
  laplace: "Laplace",
  series: "Series de Fourier",
  fourier: "Fourier y muestreo",
};
const demoFilters = document.querySelector("#demo-filters");
const demoCount = document.querySelector("#demo-count");
let selectedTopic = "all";

function renderDemos() {
  const visibleDemos = demos.filter(demo => selectedTopic === "all" || demo.topics.includes(selectedTopic));
  demoCount.textContent = `${selectedTopic === "all" ? "Todos los temas" : topicLabels[selectedTopic]}: ${visibleDemos.length} de ${demos.length} demos y juegos`;

  if (visibleDemos.length === 0) {
    demoGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon" aria-hidden="true">∿</span>
        <h3>No hay demos para este tema</h3>
        <p>Selecciona otro tema o pulsa «Mostrar todos».</p>
      </div>
    `;
    return;
  }

  demoGrid.innerHTML = visibleDemos
    .map(
      (demo) => `
        <a class="demo-card" href="${demo.href}">
          <div class="demo-card-top">
            <span class="demo-category">${demo.category}</span>
            <span class="demo-number">${String(demos.indexOf(demo) + 1).padStart(2, "0")}</span>
          </div>
          <h3>${demo.title}</h3>
          <p>${demo.description}</p>
          <div class="demo-topics" aria-label="Temas">${demo.topics.map(topic => `<span>${topicLabels[topic]}</span>`).join("")}</div>
          <span class="demo-card-link">Abrir demo <span aria-hidden="true">↗</span></span>
        </a>
      `,
    )
    .join("");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  siteNav.classList.toggle("is-open", !isOpen);
});

siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("is-open");
  }
});

demoFilters.addEventListener("click", event => {
  const button = event.target.closest("[data-topic]");
  if (!button) return;
  selectedTopic = button.dataset.topic;
  demoFilters.querySelectorAll("[data-topic]").forEach(filter => {
    filter.setAttribute("aria-pressed", String(filter === button));
  });
  renderDemos();
});

renderDemos();
