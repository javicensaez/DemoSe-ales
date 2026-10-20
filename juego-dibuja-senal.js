(() => {
  'use strict';
  const challenges = [
    { title: 'Reto 1', formula: 'x(t) = (1-t)u(t+2) + t u(t) - (t-2)u(t-2) + (t-3)u(t-3)', points: [[-4,0],[-2,0],[-2,3],[0,1],[2,1],[3,0],[8,0]] },
    { title: 'Reto 2', formula: 'x(t) = 3u(t) - 3u(t-3)', points: [[-4,0],[0,0],[0,3],[3,3],[3,0],[8,0]] },
    { title: 'Reto 3', formula: 'x(t) = 2t u(t) - 4(t-2)u(t-2) + 2(t-4)u(t-4)', points: [[-4,0],[0,0],[2,4],[4,0],[8,0]] },
    { title: 'Reto 4', formula: 'x(t) = t u(t) - (t-2)u(t-2) - (t-4)u(t-4) + (t-6)u(t-6)', points: [[-4,0],[0,0],[2,2],[4,2],[6,0],[8,0]] },
    { title: 'Reto 5', formula: 'x(t) = -2u(t-1) + 2u(t-5)', points: [[-4,0],[1,0],[1,-2],[5,-2],[5,0],[8,0]] },
    { title: 'Reto 6', formula: 'x(t) = t u(t) - (t-3)u(t-3) - 5u(t-3) + (t-3)u(t-3) - (t-5)u(t-5)', points: [[-4,0],[0,0],[3,3],[3,-2],[5,0],[8,0]] },
    { title: 'Reto 7', formula: 'x(t) = u(t) + 2u(t-2) - 4u(t-4) + u(t-6)', points: [[-4,0],[0,0],[0,1],[2,1],[2,3],[4,3],[4,-1],[6,-1],[6,0],[8,0]] },
  ];
  const $ = id => document.getElementById(id);
  const svg = $('drawing-plot');
  const ns = 'http://www.w3.org/2000/svg';
  let plotWidth = 800;
  const timeStep = () => (plotWidth - 140) / 12;
  const x = t => 70 + (t + 4) * timeStep();
  const y = a => 390 - (a + 4) * 42;
  let index = 0, points = [], cursor = [-4,0], reveal = false;
  const saved = challenges.map(() => []);
  const solved = new Set();
  function element(tag, attrs, parent = svg, text) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key,value]) => el.setAttribute(key,value));
    if (text !== undefined) el.textContent = text;
    parent.append(el);
    return el;
  }
  function render() {
    const bounds = svg.getBoundingClientRect();
    plotWidth = bounds.height > 0 ? Math.max(800, 460 * bounds.width / bounds.height) : 800;
    svg.setAttribute('viewBox', `0 0 ${plotWidth} 460`);
    svg.replaceChildren();
    element('title', {}, svg, 'Dibujo de señal: tiempo de −4 a 8 segundos y amplitud de −4 a 4 voltios');
    for (let t = -4; t <= 8; t++) {
      element('line', {x1:x(t), x2:x(t), y1:y(4), y2:y(-4), class:t === 0 ? 'draw-axis' : 'draw-grid'});
      element('text', {x:x(t), y:414, 'text-anchor':'middle'}, svg, t);
    }
    for (let a = -4; a <= 4; a++) {
      element('line', {x1:x(-4), x2:x(8), y1:y(a), y2:y(a), class:a === 0 ? 'draw-axis' : 'draw-grid'});
      element('text', {x:55, y:y(a)+5, 'text-anchor':'end'}, svg, a);
    }
    element('text', {x:plotWidth / 2, y:448, 'text-anchor':'middle'}, svg, 'Tiempo t (s)');
    element('text', {x:20, y:220, transform:'rotate(-90 20 220)', 'text-anchor':'middle'}, svg, 'Amplitud (V)');
    if (reveal) element('polyline', {points:challenges[index].points.map(p=>`${x(p[0])},${y(p[1])}`).join(' '), class:'draw-solution'});
    element('polyline', {points:points.map(p=>`${x(p[0])},${y(p[1])}`).join(' '), class:'draw-line'});
    points.forEach(p => element('circle', {cx:x(p[0]), cy:y(p[1]), r:5, class:'draw-point'}));
    element('circle', {cx:x(cursor[0]), cy:y(cursor[1]), r:10, class:'draw-cursor'});
    $('cursor-status').textContent = `Cursor: t = ${cursor[0]} s, amplitud = ${cursor[1]} V. Puntos: ${points.length}.`;
    $('point-time').value = cursor[0];
    $('point-amplitude').value = cursor[1];
    $('drawing-points').textContent = points.length ? 'Tus puntos (s, V): ' + points.map(p=>`(${p.join(', ')})`).join(' → ') : 'Todavía no has añadido puntos.';
    $('undo').disabled = $('clear').disabled = points.length === 0;
    $('compare').disabled = points.length < 2;
    $('solution').setAttribute('aria-pressed', String(reveal));
    $('solution').textContent = reveal ? 'Ocultar solución' : 'Ver solución';
    $('drawing-legend').hidden = !reveal;
  }
  function feedback(text) { $('drawing-feedback').textContent = text; }
  function add(p) {
    const last = points.at(-1);
    if (last && p[0] < last[0]) { feedback('Avanza de izquierda a derecha. Deshaz puntos si necesitas corregir un tramo anterior.'); return; }
    if (last && p[0] === last[0] && p[1] === last[1]) { feedback('Ese es el último punto: elige otro cruce para crear un tramo.'); return; }
    points.push([...p]); cursor = [...p]; reveal = false;
    feedback('Punto añadido. Continúa el dibujo o pulsa «Comparar».'); render();
  }
  // Reduce consecutive segments only when they share a direction and a line.
  function simplify(input) {
    const result = [];
    for (const p of input) {
      while (result.length >= 2) {
        const a = result.at(-2), b = result.at(-1);
        const u = [b[0]-a[0],b[1]-a[1]], v = [p[0]-b[0],p[1]-b[1]];
        if (u[0]*v[1] !== u[1]*v[0] || u[0]*v[0]+u[1]*v[1] <= 0) break;
        result.pop();
      }
      result.push(p);
    }
    return result;
  }
  svg.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const pt = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    if (pt.x < x(-4)-10 || pt.x > x(8)+10 || pt.y < y(4)-10 || pt.y > y(-4)+10) return;
    svg.focus();
    add([Math.max(-4, Math.min(8,Math.round((pt.x-70)/timeStep()-4))), Math.max(-4,Math.min(4,Math.round((390-pt.y)/42-4)))]);
  });
  svg.addEventListener('keydown', event => {
    const moves = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};
    if (moves[event.key]) {
      event.preventDefault(); const d = moves[event.key];
      cursor = [Math.max(-4,Math.min(8,cursor[0]+d[0])),Math.max(-4,Math.min(4,cursor[1]+d[1]))]; render();
    } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); add(cursor); }
    else if (event.key === 'Escape') { reveal = false; render(); }
  });
  $('point-form').addEventListener('submit', event => {
    event.preventDefault();
    const p = [$('point-time').valueAsNumber, $('point-amplitude').valueAsNumber];
    if (!p.every(Number.isInteger) || p[0]<-4 || p[0]>8 || p[1]<-4 || p[1]>4) { feedback('Introduce valores enteros: tiempo entre −4 y 8 s, amplitud entre −4 y 4 V.'); return; }
    add(p);
  });
  $('compare').addEventListener('click', () => {
    const correct = JSON.stringify(simplify(points)) === JSON.stringify(simplify(challenges[index].points));
    if (correct) { solved.add(index); updateProgress(); }
    feedback(correct ? '¡Correcto! Todos los tramos coinciden con la señal pedida.' : 'Todavía no coincide. Revisa los tiempos, las amplitudes y los saltos; incluye el dibujo completo de −4 a 8 s.');
  });
  $('undo').addEventListener('click', () => { points.pop(); reveal = false; feedback('Último punto eliminado.'); render(); });
  $('clear').addEventListener('click', () => { points.length = 0; reveal = false; feedback('Dibujo borrado. Vuelve a empezar en t = −4 s.'); render(); });
  $('solution').addEventListener('click', () => { reveal = !reveal; render(); });
  function updateProgress() { $('challenge-progress').textContent = `Reto ${index+1} de ${challenges.length} · ${solved.size} superados`; }
  function load(next) {
    saved[index] = points; index = next; points = saved[index]; cursor = points.length ? [...points.at(-1)] : [-4,0]; reveal = false;
    $('challenge-title').textContent = challenges[index].title;
    const formula = challenges[index].formula;
    const container = $('challenge-formula');
    const updateFormula = () => {
      if (challenges[index].formula !== formula) return;
      window.MathJax?.typesetClear?.([container]);
      container.textContent = '\\(' + formula + '\\)';
      return window.MathJax?.typesetPromise?.([container]);
    };
    if (window.MathJax?.startup?.promise) {
      window.MathJax.startup.promise = window.MathJax.startup.promise.then(updateFormula).catch(() => {
        container.textContent = challenges[index].formula;
      });
    } else {
      container.textContent = formula;
    }
    $('previous-challenge').disabled = index === 0;
    $('next-challenge').disabled = index === challenges.length-1;
    updateProgress(); feedback('Representa la señal descrita y pulsa «Comparar».'); render();
  }
  $('previous-challenge').addEventListener('click', () => load(Math.max(0,index-1)));
  $('next-challenge').addEventListener('click', () => load(Math.min(challenges.length-1,index+1)));
  new ResizeObserver(() => render()).observe(svg);
  load(0);
})();
