'use strict';
const coefficientHost=document.querySelector('#xy-coefficients');
const periodInput=document.querySelector('#xy-period'), exampleInput=document.querySelector('#xy-example');
const playButton=document.querySelector('#xy-play'), guideInput=document.querySelector('#xy-guide');
const scaleInputs={X:document.querySelector('#xy-scale-x'),Y:document.querySelector('#xy-scale-y')};
const syncInput=document.querySelector('#xy-scale-sync'),conjugateButton=document.querySelector('#xy-conjugate');
const rotationInput=document.querySelector('#xy-rotation');
const harmonicInput=document.querySelector('#xy-order');
let maxHarmonic=7;
const rangeInput=document.querySelector('#xy-range');
const svg=document.querySelector('#xy-plot'), signalsSvg=document.querySelector('#xy-signals');
const fmt=new Intl.NumberFormat('es',{maximumFractionDigits:2});
let coefficients,period=10,elapsed=0,running=false,lastTime=null,completed=false,points=[],mapX,mapY;
function buildCoefficientFields(){
 coefficientHost.replaceChildren();
 for(const channel of ['X','Y']){
 const fieldset=document.createElement('fieldset');
 fieldset.innerHTML=`<legend>Señal ${channel}</legend><div class="fourier-xy-table"><table><thead><tr><th scope="col">k</th><th scope="col">Re(${channel}ₖ)</th><th scope="col">Im(${channel}ₖ)</th></tr></thead><tbody>${Array.from({length:maxHarmonic+1},(_,k)=>`<tr><th scope="row">${k}</th>${['real','imag'].map(part=>`<td>${k===0&&part==='imag'?'0':`<input type="number" id="xy-${channel}-${k}-${part}" min="-100" max="100" step="any" value="0" aria-label="${channel}, coeficiente ${k}, parte ${part==='real'?'real':'imaginaria'}" />`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 coefficientHost.append(fieldset);
 }
}
buildCoefficientFields();
function evaluate(series,phase){
 let result=series[0].real;
 for(let k=1;k<series.length;k++)result+=2*(series[k].real*Math.cos(k*phase)-series[k].imag*Math.sin(k*phase));
 return result;
}
function setRunning(value){running=value;lastTime=null;playButton.textContent=running?'Pausar':elapsed>0?'Reanudar':'Iniciar';playButton.setAttribute('aria-pressed',String(running));document.querySelector('#xy-status').textContent=running?'Dibujando: una vuelta por periodo.':elapsed>0?'Animación pausada.':'Listo para dibujar.';}
function readAndDraw(){
 let valid=true;const next={};
 for(const channel of ['X','Y'])next[channel]=Array.from({length:maxHarmonic+1},(_,k)=>{
  const value={imag:0};
  for(const part of k===0?['real']:['real','imag']){
   const input=document.querySelector(`#xy-${channel}-${k}-${part}`),number=Number(input.value);
   const ok=input.value.trim()!==''&&Number.isFinite(number)&&Math.abs(number)<=100;
   input.setAttribute('aria-invalid',String(!ok));valid=valid&&ok;value[part]=number;
  }
  return value;
 });
 const newPeriod=Number(periodInput.value),periodValid=periodInput.value.trim()!==''&&Number.isFinite(newPeriod)&&newPeriod>=.5&&newPeriod<=60;
 periodInput.setAttribute('aria-invalid',String(!periodValid));valid=valid&&periodValid;
 const error=document.querySelector('#xy-error');error.hidden=valid;playButton.disabled=!valid;conjugateButton.disabled=!valid;
 if(!valid){error.textContent='Completa los coeficientes entre −100 y 100 y el periodo entre 0,5 y 60 segundos.';setRunning(false);return;}
 for(const channel of ['X','Y']){
  const scale=Number(scaleInputs[channel].value);
  document.querySelector(`#xy-scale-${channel.toLowerCase()}-value`).textContent=fmt.format(scale);
  scaleInputs[channel].setAttribute('aria-valuetext',fmt.format(scale));

 }
 document.querySelector('#xy-rotation-value').textContent=`${rotationInput.value}°`;
 rotationInput.setAttribute('aria-valuetext',`${rotationInput.value} grados`);
 coefficients=next;period=newPeriod;elapsed=0;completed=false;lastTime=null;
 points=Array.from({length:1401},(_,n)=>{const phase=2*Math.PI*n/1400;return {x:evaluate(next.X,phase),y:evaluate(next.Y,phase)};});
 drawPlots();updateFrame();setRunning(running);
}
function axes(xmin,xmax,ymin,ymax,left,right,top,bottom){
 const x=v=>left+(v-xmin)/(xmax-xmin)*(right-left),y=v=>bottom-(v-ymin)/(ymax-ymin)*(bottom-top);
 let markup='';
 for(let i=0;i<=4;i++){
  const xv=xmin+(xmax-xmin)*i/4,yv=ymin+(ymax-ymin)*i/4;
  markup+=`<line class="plot-grid-line" x1="${x(xv)}" x2="${x(xv)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(xv)}" y="${bottom+22}" text-anchor="middle">${fmt.format(xv)}</text><line class="plot-grid-line" x1="${left}" x2="${right}" y1="${y(yv)}" y2="${y(yv)}"/><text class="plot-tick-label" x="${left-8}" y="${y(yv)+4}" text-anchor="end">${fmt.format(yv)}</text>`;
 }
 if(xmin<=0&&xmax>=0)markup+=`<line class="plot-axis-line" x1="${x(0)}" x2="${x(0)}" y1="${top}" y2="${bottom}"/>`;
 if(ymin<=0&&ymax>=0)markup+=`<line class="plot-axis-line" x1="${left}" x2="${right}" y1="${y(0)}" y2="${y(0)}"/>`;
 return {x,y,markup};
}
function pathFor(data,x,y){return data.map((p,n)=>`${n?'L':'M'}${x(p.x).toFixed(2)},${y(p.y).toFixed(2)}`).join(' ');}
function drawPlots(){
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 const half=Number(rangeInput.value);
 const xy=axes(-half,half,-half,half,65,565,35,535);mapX=xy.x;mapY=xy.y;
 svg.innerHTML=xy.markup+`<text class="plot-axis-label" x="565" y="583" text-anchor="end">X (u.a.)</text><text class="plot-axis-label" x="15" y="20">Y (u.a.)</text><defs><clipPath id="xy-plot-clip"><rect x="65" y="35" width="500" height="500"/></clipPath></defs><g clip-path="url(#xy-plot-clip)"><path id="xy-guide-path" d="${pathFor(points,mapX,mapY)}" fill="none" stroke="var(--wave)" opacity="0.18" stroke-width="2"/><path id="xy-trace" fill="none" stroke="var(--wave)" stroke-width="3"/><circle id="xy-pencil" r="6" fill="#d97706" stroke="var(--foreground)" stroke-width="1.5"/></g>`;
 document.querySelector('#xy-guide-path').style.display=guideInput.checked?'':'none';
 const amplitude=Math.max(1,...xs.map(Math.abs),...ys.map(Math.abs))*1.12,timeAxes=axes(0,period,-amplitude,amplitude,65,670,25,245);
 signalsSvg.innerHTML=timeAxes.markup+['X','Y'].map((channel,i)=>`<path d="${pathFor(points.map((p,n)=>({x:n*period/1400,y:i?p.y:p.x})),timeAxes.x,timeAxes.y)}" fill="none" stroke="${i?'#d97706':'var(--wave)'}" stroke-width="2.5" ${i?'stroke-dasharray="7 4"':''}/>`).join('')+`<line id="xy-time-cursor" y1="25" y2="245" stroke="var(--foreground)" stroke-dasharray="3 4"/><text class="plot-axis-label" x="670" y="291" text-anchor="end">Tiempo (s)</text><text class="plot-axis-label" x="10" y="16">Amplitud (u.a.)</text>`;
}
function updateFrame(){
 if(!coefficients)return;
 const phase=elapsed/period*2*Math.PI,x=evaluate(coefficients.X,phase),y=evaluate(coefficients.Y,phase);
 const n=Math.floor(elapsed/period*1400),trace=completed?points:[...points.slice(0,n+1),{x,y}];
 document.querySelector('#xy-trace').setAttribute('d',pathFor(trace,mapX,mapY));
 const dot=document.querySelector('#xy-pencil');dot.setAttribute('cx',mapX(x));dot.setAttribute('cy',mapY(y));
 const cursor=document.querySelector('#xy-time-cursor'),tx=65+605*elapsed/period;cursor.setAttribute('x1',tx);cursor.setAttribute('x2',tx);
 document.querySelector('#xy-position').textContent=`t = ${fmt.format(elapsed)} s / ${fmt.format(period)} s · X = ${fmt.format(x)} u.a. · Y = ${fmt.format(y)} u.a.`;
}
function loadExample(name){
 const presets={astroid:{X:{1:[2.25,0],3:[.75,0]},Y:{1:[0,2.25],3:[0,-.75]}},heart:{X:{1:[0,-6],3:[0,2]},Y:{1:[6.5,0],2:[-2.5,0],3:[-1,0],4:[-.5,0]}},circle:{X:{1:[5,0]},Y:{1:[0,-5]}},eight:{X:{1:[0,-6]},Y:{2:[0,-4]}},flower:{X:{2:[2.5,0],4:[2.5,0]},Y:{2:[0,2.5],4:[0,-2.5]}},zero:{X:{},Y:{}}};
 if(name==='squareRamps'){
  // Integral exacta de los tramos lineales: Ck = Fourier(x')/(j·2πk).
  // X: rampa −6→6, constante 6, rampa 6→−6, constante −6.
  // Y es X retrasada un cuarto del periodo.
  presets.squareRamps={X:{},Y:{}};
  for(let k=1;k<=20;k++){
   const w=2*Math.PI*k;
   let real=0,imag=0;
   for(const [a,b,slope] of [[0,.25,48],[.5,.75,-48]]){
    real-=slope*(Math.cos(w*a)-Math.cos(w*b))/(w*w);
    imag-=slope*(-Math.sin(w*a)+Math.sin(w*b))/(w*w);
   }
   if(Math.abs(real)<1e-12)real=0;if(Math.abs(imag)<1e-12)imag=0;
   presets.squareRamps.X[k]=[real,imag];
   const phase=-w/4;
   const yr=real*Math.cos(phase)-imag*Math.sin(phase),yi=real*Math.sin(phase)+imag*Math.cos(phase);
   presets.squareRamps.Y[k]=[Math.abs(yr)<1e-12?0:yr,Math.abs(yi)<1e-12?0:yi];
  }
 }
 const preset=presets[name];if(!preset)return;
 maxHarmonic=name==='squareRamps'?20:7;harmonicInput.value=String(maxHarmonic);buildCoefficientFields();
 for(const channel of ['X','Y'])for(let k=0;k<=maxHarmonic;k++)for(const [i,part]of ['real','imag'].entries()){
  const input=document.querySelector(`#xy-${channel}-${k}-${part}`);if(input)input.value=preset[channel][k]?.[i]??0;
 }
 for(const input of coefficientHost.querySelectorAll('input'))input.dataset.base=input.value;
 scaleInputs.X.value=1;scaleInputs.Y.value=1;rotationInput.value=0;
 setRunning(false);readAndDraw();
}
function applyScales(){
 const theta=Number(rotationInput.value)*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta);
 for(let k=1;k<=maxHarmonic;k++)for(const part of ['real','imag']){
  const x=document.querySelector(`#xy-X-${k}-${part}`),y=document.querySelector(`#xy-Y-${k}-${part}`);
  for(const input of [x,y])if(input.dataset.base===undefined)input.dataset.base=input.value;
  if([x,y].some(input=>input.dataset.base.trim()===''||!Number.isFinite(Number(input.dataset.base))))continue;
  const bx=Number(x.dataset.base)*Number(scaleInputs.X.value),by=Number(y.dataset.base)*Number(scaleInputs.Y.value);
  x.value=String(Number((c*bx-s*by).toPrecision(15)));y.value=String(Number((s*bx+c*by).toPrecision(15)));
 }
 readAndDraw();
}
rotationInput.addEventListener('input',applyScales);
for(const [channel,input] of Object.entries(scaleInputs))input.addEventListener('input',()=>{
 if(syncInput.checked)scaleInputs[channel==='X'?'Y':'X'].value=input.value;
 applyScales();
});
syncInput.addEventListener('change',()=>{if(syncInput.checked){scaleInputs.Y.value=scaleInputs.X.value;applyScales();}});
conjugateButton.addEventListener('click',()=>{
 for(const input of coefficientHost.querySelectorAll('input[id$="-imag"]')){const base=Number(input.dataset.base??input.value);input.value=String(-Number(input.value));input.dataset.base=String(-base);}
 exampleInput.value='custom';readAndDraw();
 document.querySelector('#xy-status').textContent='Coeficientes X e Y conjugados: recorrido invertido.';
});
coefficientHost.addEventListener('input',event=>{
 const input=event.target,k=Number(input.id.split('-')[2]),part=input.id.split('-')[3];
 if(k===0)input.dataset.base=input.value;
 else{
  const x=document.querySelector(`#xy-X-${k}-${part}`),y=document.querySelector(`#xy-Y-${k}-${part}`);
  if([x,y].every(field=>field.value.trim()!==''&&Number.isFinite(Number(field.value)))){
   const theta=Number(rotationInput.value)*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta),vx=Number(x.value),vy=Number(y.value);
   x.dataset.base=String((c*vx+s*vy)/Number(scaleInputs.X.value));
   y.dataset.base=String((-s*vx+c*vy)/Number(scaleInputs.Y.value));
  }else input.dataset.base='';
 }
 exampleInput.value='custom';readAndDraw();
});
harmonicInput.addEventListener('change',()=>{
 const previous={};
 for(const input of coefficientHost.querySelectorAll('input'))previous[input.id]={value:input.value,base:input.dataset.base};
 maxHarmonic=Number(harmonicInput.value);buildCoefficientFields();
 for(const input of coefficientHost.querySelectorAll('input'))if(Object.hasOwn(previous,input.id)){input.value=previous[input.id].value;input.dataset.base=previous[input.id].base??input.value;}
 exampleInput.value='custom';readAndDraw();
});
periodInput.addEventListener('input',readAndDraw);
rangeInput.addEventListener('change',()=>{drawPlots();updateFrame();});
exampleInput.addEventListener('change',()=>loadExample(exampleInput.value));
guideInput.addEventListener('change',()=>{document.querySelector('#xy-guide-path').style.display=guideInput.checked?'':'none';});
playButton.addEventListener('click',()=>setRunning(!running));
document.querySelector('#xy-clear').addEventListener('click',()=>{setRunning(false);elapsed=0;completed=false;updateFrame();});
function animate(timestamp){
 if(running&&!document.hidden){if(lastTime!==null){elapsed+=Math.min(.1,(timestamp-lastTime)/1000);if(elapsed>=period){completed=true;elapsed%=period;}updateFrame();}lastTime=timestamp;}else lastTime=null;
 requestAnimationFrame(animate);
}
loadExample('heart');requestAnimationFrame(animate);
