# Sistemas y señales

Web educativa con demos interactivas para explorar conceptos de sistemas y señales. La interfaz está en español y utiliza una estética azul inspirada en la Universidad de Deusto.

## Cómo abrir la web

No se necesita instalar dependencias ni compilar el proyecto. Abre `index.html` en un navegador para acceder al catálogo y navegar a las demos.

Las páginas también pueden servirse desde cualquier servidor de archivos estáticos. MathJax se carga desde jsDelivr en las páginas que muestran ecuaciones.

El botón **Modo proyector**, disponible en la navegación de la página principal y de todas las demos, activa una paleta clara de alto contraste. La preferencia se conserva al navegar entre páginas.

## Demos

- **Señales básicas** (`senales-basicas.html`): explora señales elementales como la delta, el escalón, pulsos, la sinc, ondas periódicas y la exponencial compleja.
- **Adivina la expresión** (`juego-expresiones.html`): interpreta una gráfica, escribe la expresión de la señal y comprueba la respuesta.
- **Transforma la señal** (`juego-transformaciones.html`): practica desplazamientos, inversión temporal y escalado de señales.
- **Señales pares e impares** (`juego-simetria.html`): predice las componentes par e impar y comprueba la solución.
- **Potencia y valores de señales periódicas** (`potencia-senales-periodicas.html`): compara cinco formas de onda y consulta su valor medio, la potencia media, el valor eficaz y el valor eficaz de alterna.
- **Preguntas de sistemas** (`sistemas-preguntas.html`): clasifica diez sistemas por memoria, causalidad, linealidad, invariancia temporal y estabilidad BIBO.
- **Convolución paso a paso** (`convolucion.html`): elige señales, desplázalas y observa el solapamiento, el producto y la convolución.
- **Convolución discreta paso a paso** (`convolucion-discreta.html`): introduce dos secuencias, desplaza una sobre la otra y consulta cada producto y su suma.
- **Muestreo y aliasing** (`muestreo.html`): compara senos, suma de tonos y ondas periódicas rectangular y triangular; ajusta la frecuencia de muestreo y observa las muestras, el aliasing y la reconstrucción sinc.
- **Laboratorio de series de Fourier** (`series-fourier.html`): compara una señal periódica con su suma parcial y explora coeficientes, espectro y error RMS.
- **Desafío de Fourier** (`juego-fourier.html`): calcula coeficientes trigonométricos o módulo/fase, reconstruye la señal objetivo y comprueba tu resultado.

## Estructura

- Cada demo tiene una página HTML propia y puede tener un archivo JavaScript dedicado.
- `styles.css` contiene los estilos compartidos.
- `app.js` define las tarjetas que aparecen en el catálogo de `index.html`.
- `assets/` contiene los recursos estáticos.
- `AGENTS.md` recoge las pautas de diseño y desarrollo para las demos.

## Añadir una demo

Al crear una demo:

1. Crea su página HTML y, si necesita lógica, un archivo JavaScript propio.
2. Añádela al catálogo en `app.js`, con categoría, título, descripción y enlace.
3. Añade una entrada en la sección **Demos** de este README con una descripción breve.
4. Sigue las convenciones de `AGENTS.md` y valida la página, sus controles y la sintaxis JavaScript.
