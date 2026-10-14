# Guía para crear demos

Estas pautas se aplican a las demos nuevas y a los cambios en demos existentes. Mantén la aplicación ligera: HTML, CSS y JavaScript nativos, sin introducir frameworks o dependencias innecesarias.

## Estructura

- Cada demo debe tener su propia página HTML y, si necesita lógica, un archivo JavaScript dedicado.
- Usa `styles.css` para los estilos compartidos. Añade una clase específica a `<body>` o al contenedor principal si la demo necesita estilos propios.
- Enlaza el CSS compartido y carga el script de la página con `defer`.
- Añade la demo al catálogo definido en `app.js`, con categoría, título, descripción breve y enlace relativo.
- Reutiliza el encabezado, la navegación, el enlace «Volver a las demos» y el pie de página de las páginas existentes.
- Guarda los recursos propios en `assets/` y usa rutas relativas para que las páginas estáticas funcionen localmente.

## Apariencia y contenido

- Mantén la estética de la web: paleta azul, fondos claros tipo papel cuadriculado, tarjetas limpias, tipografía legible y diseño adaptable.
- Sigue los tokens y componentes de `styles.css`; evita duplicar estilos globales o definir otra identidad visual.
- Escribe la interfaz, las instrucciones, las unidades y los mensajes en español.
- Presenta el objetivo de aprendizaje y las instrucciones antes de los controles o la gráfica.
- En juegos, explica la tarea y deja claro qué debe hacer el alumno antes de mostrar una solución. Conserva la navegación entre retos cuando corresponda.
- Usa LaTeX con MathJax para ecuaciones matemáticas. Si las fórmulas cambian dinámicamente, actualiza el contenido de forma segura y vuelve a ejecutar el renderizado de MathJax sin acumular nodos renderizados.

## Interacción y visualizaciones

- Usa HTML semántico: botones para acciones, enlaces para navegación, etiquetas asociadas a campos y regiones con nombres accesibles.
- Mantén estados visibles y comprensibles: selección actual, errores de entrada, resultados, progreso y disponibilidad de acciones.
- Las gráficas SVG deben tener `viewBox`, texto o etiquetas accesibles, ejes y unidades. Ajusta los rangos a los datos y conserva la misma escala cuando se comparen señales.
- Asegura que las interacciones funcionen con teclado y que el foco sea visible. No comuniques el estado solo mediante color.
- Valida entradas antes de calcular y comunica cómo corregirlas; no ocultes errores con valores por defecto silenciosos.
- No ejecutes expresiones proporcionadas por el usuario con `eval` o `Function`. Usa un parser acotado o controles tipados.

## Calidad y comprobación

- Mantén los cambios acotados a la demo y las superficies compartidas que realmente necesite.
- Comprueba que el enlace nuevo aparece en el catálogo y que la página funciona de forma independiente.
- Valida la sintaxis de JavaScript con `node --check` y revisa diagnósticos disponibles.
- Prueba en el navegador los controles principales, casos límite relevantes, navegación y diseño adaptable.
- Cuando se muestren resultados matemáticos, contrástalos con valores conocidos o cálculos independientes y comprueba las unidades.
