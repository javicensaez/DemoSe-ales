const demos = [
  {
    category: "Señales básicas",
    title: "Señales básicas",
    description:
      "Explora la delta de Dirac, el escalón, pulsos, ondas periódicas y la exponencial compleja.",
    href: "senales-basicas.html",
  },
  {
    category: "Juego · Exprésalo",
    title: "Adivina la expresión",
    description:
      "Observa una señal, escribe su expresión con escalones y funciones básicas y comprueba tu respuesta en la gráfica.",
    href: "juego-expresiones.html",
  },
  {
    category: "Juego · Transformaciones",
    title: "Transforma la señal",
    description:
      "Compara una señal de origen con su versión transformada y averigua su retraso, inversión temporal y escalado.",
    href: "juego-transformaciones.html",
  },
  {
    category: "Juego · Simetría",
    title: "Señales pares e impares",
    description:
      "Dibuja en tu cuaderno las partes par e impar de una señal, revela la solución y comprueba tus dibujos.",
    href: "juego-simetria.html",
  },
  {
    category: "Demo · Valores medios y eficaces",
    title: "Potencia y valores de señales periódicas",
    description:
      "Compara cinco señales periódicas y consulta su valor medio, potencia media, valor eficaz y valor eficaz de alterna.",
    href: "potencia-senales-periodicas.html",
  },
  {
    category: "Juego · Sistemas",
    title: "Preguntas de sistemas",
    description:
      "Clasifica diez sistemas según memoria, causalidad, linealidad, invariancia temporal y estabilidad BIBO.",
    href: "sistemas-preguntas.html",
  },
  {
    category: "Demo · Operaciones con señales",
    title: "Convolución paso a paso",
    description:
      "Elige x(t) y h(t), desplaza una señal con el deslizador y observa el producto y la integral de convolución.",
    href: "convolucion.html",
  },
  {
    category: "Demo · Operaciones con señales",
    title: "Convolución discreta paso a paso",
    description:
      "Introduce secuencias cortas y desplaza una sobre la otra para ver cada producto y la suma de convolución.",
    href: "convolucion-discreta.html",
  },
  {
    category: "Demo · Muestreo",
    title: "Muestreo y aliasing",
    description:
      "Ajusta la frecuencia de muestreo, visualiza las muestras y compara la señal original con su reconstrucción.",
    href: "muestreo.html",
  },
  {
    category: "Demo · Series de Fourier",
    title: "Laboratorio de series de Fourier",
    description:
      "Explora la síntesis de señales periódicas, sus coeficientes y el espectro al variar el número de armónicos.",
    href: "series-fourier.html",
  },
  {
    category: "Juego · Series de Fourier",
    title: "Desafío de Fourier",
    description:
      "Calcula coeficientes en forma trigonométrica o módulo/fase, reconstruye señales y comprueba tu puntuación.",
    href: "juego-fourier.html",
  },
];

const demoGrid = document.querySelector("#demo-grid");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

function renderDemos() {
  if (demos.length === 0) {
    demoGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon" aria-hidden="true">∿</span>
        <h3>Las demos están por llegar</h3>
        <p>Aquí aparecerán las experiencias interactivas. Iremos sumándolas una a una.</p>
      </div>
    `;
    return;
  }

  demoGrid.innerHTML = demos
    .map(
      (demo, index) => `
        <a class="demo-card" href="${demo.href}">
          <div class="demo-card-top">
            <span class="demo-category">${demo.category}</span>
            <span class="demo-number">${String(index + 1).padStart(2, "0")}</span>
          </div>
          <h3>${demo.title}</h3>
          <p>${demo.description}</p>
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

renderDemos();
