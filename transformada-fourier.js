'use strict';
const controls=Object.fromEntries(['signal','delay','amplitude','scale','invert'].map(name=>[name,document.querySelector(`#tf-${name}`)]));
const combineControl=document.querySelector('#tf-combine');
const format=new Intl.NumberFormat('es',{maximumFractionDigits:3});
const sinc=x=>Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);
const signalDefinitions={
 rect:{time:t=>Math.abs(t)<.5?1:Math.abs(t)===.5?.5:0,spectrum:f=>({re:sinc(f),im:0}),pair:String.raw`\[x(t)=\operatorname{rect}(t),\quad |t|<\tfrac12\qquad X(f)=\operatorname{sinc}(f)\]`},
 tri:{time:t=>Math.max(0,1-Math.abs(t)),spectrum:f=>({re:sinc(f)**2,im:0}),pair:String.raw`\[x(t)=\max(1-|t|,0)\qquad X(f)=\operatorname{sinc}^2(f)\]`},
 gauss:{time:t=>Math.exp(-Math.PI*t*t),spectrum:f=>({re:Math.exp(-Math.PI*f*f),im:0}),pair:String.raw`\[x(t)=e^{-\pi t^2}\qquad X(f)=e^{-\pi f^2}\]`},
 exp:{time:t=>t>0?Math.exp(-t):t===0?.5:0,spectrum:f=>({re:1/(1+(2*Math.PI*f)**2),im:-2*Math.PI*f/(1+(2*Math.PI*f)**2)}),pair:String.raw`\[x(t)=e^{-t}u(t)\qquad X(f)=\frac{1}{1+j2\pi f}\]`},
 bilateral:{time:t=>Math.exp(-Math.abs(t)),spectrum:f=>({re:2/(1+(2*Math.PI*f)**2),im:0}),pair:String.raw`\[x(t)=e^{-|t|}\qquad X(f)=\frac{2}{1+(2\pi f)^2}\]`},
 sinc:{time:t=>sinc(t),spectrum:f=>({re:Math.abs(f)<.5?1:Math.abs(f)===.5?.5:0,im:0}),pair:String.raw`\[x(t)=\operatorname{sinc}(t)=\frac{\sin(\pi t)}{\pi t}\qquad X(f)=\operatorname{rect}(f)\]`},
 complex:{time:t=>Math.cos(2*Math.PI*t),timeImag:t=>Math.sin(2*Math.PI*t),atoms:[{f:1,re:1,im:0}],pair:String.raw`\[x(t)=e^{j2\pi t}=\cos(2\pi t)+j\sin(2\pi t)\qquad X(f)=\delta(f-1)\]`},
 cos:{time:t=>Math.cos(2*Math.PI*t),atoms:[{f:-1,re:.5,im:0},{f:1,re:.5,im:0}],pair:String.raw`\[x(t)=\cos(2\pi t)\qquad X(f)=\tfrac12\delta(f-1)+\tfrac12\delta(f+1)\]`},
 sin:{time:t=>Math.sin(2*Math.PI*t),atoms:[{f:-1,re:0,im:.5},{f:1,re:0,im:-.5}],pair:String.raw`\[x(t)=\sin(2\pi t)\qquad X(f)=\frac{\delta(f-1)-\delta(f+1)}{2j}\]`},
 constant:{time:()=>1,atoms:[{f:0,re:1,im:0}],pair:String.raw`\[x(t)=1\qquad X(f)=\delta(f)\]`},
 delta:{spectrum:()=>({re:1,im:0}),pair:String.raw`\[x(t)=\delta(t)\qquad X(f)=1\]`}
};
function parameters(){
 const amplitude=Number(controls.amplitude.value),delay=Number(controls.delay.value),scale=Number(controls.scale.value);
 if(!Object.hasOwn(signalDefinitions,controls.signal.value)||![['amplitude',amplitude,-2,2],['delay',delay,-3,3],['scale',scale,.25,4]].every(([name,v,min,max])=>controls[name].value.trim()!==''&&Number.isFinite(v)&&v>=min&&v<=max))return null;
 return {kind:controls.signal.value,amplitude,delay,a:(controls.invert.checked?-1:1)*scale};
}
function rotateComplex(re,im,angle){return {re:re*Math.cos(angle)-im*Math.sin(angle),im:re*Math.sin(angle)+im*Math.cos(angle)};}
function transformedSpectrum(p,f){
 const z=signalDefinitions[p.kind].spectrum(f/p.a),factor=p.amplitude/Math.abs(p.a);
 return rotateComplex(z.re*factor,z.im*factor,-2*Math.PI*f*p.delay);
}
function spectralAtoms(p){
 return signalDefinitions[p.kind].atoms.map(atom=>({f:atom.f*p.a,...rotateComplex(atom.re*p.amplitude,atom.im*p.amplitude,-2*Math.PI*atom.f*p.a*p.delay)})).sort((a,b)=>a.f-b.f);
}
function timeImagValue(p,t){return p.amplitude*(signalDefinitions[p.kind].timeImag?.(p.a*(t-p.delay))??0);}
function timeValue(p,t){return p.amplitude*signalDefinitions[p.kind].time(p.a*(t-p.delay));}
const bounds={left:74,right:770,top:35,bottom:245};
function chartFrame(ymin,ymax,xlabel,ylabel,phase=false){
 if(combineControl.checked&&!phase&&xlabel==='Frecuencia f (Hz)')ymin=-ymax;
 const {left,right,top,bottom}=bounds;
 const x=v=>left+(v+6)/12*(right-left),y=v=>bottom-(v-ymin)/(ymax-ymin)*(bottom-top);
 let markup='';
 for(let i=-6;i<=6;i+=2)markup+=`<line class="${i===0?'plot-axis-line':'plot-grid-line'}" x1="${x(i)}" x2="${x(i)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(i)}" y="270" text-anchor="middle">${i}</text>`;
 for(let i=0;i<=4;i++){
  const v=ymin+(ymax-ymin)*i/4,label=phase?['−π','−π/2','0','π/2','π'][i]:format.format(Math.abs(v)<1e-12?0:v);
  markup+=`<line class="${Math.abs(v)<1e-12?'plot-axis-line':'plot-grid-line'}" x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text class="plot-tick-label" x="${left-10}" y="${y(v)+4}" text-anchor="end">${label}</text>`;
 }
 markup+=`<text class="plot-axis-label" x="${right}" y="299" text-anchor="end">${xlabel}</text><text class="plot-axis-label" x="12" y="18">${ylabel}</text>`;
 return {markup,x,y};
}
function curve(points,chart,{phase=false,jumps=false,color='var(--wave)',dashed=false}={}){
 let path='',previous=null;
 for(const point of points){
  if(point.y===null||!Number.isFinite(point.y)){previous=null;continue;}
  const move=!previous||(phase&&Math.abs(point.y-previous.y)>=Math.PI-1e-9)||(jumps&&Math.abs(point.y-previous.y)>.35);
  path+=`${move?'M':'L'}${chart.x(point.x).toFixed(2)},${chart.y(point.y).toFixed(2)} `;previous=point;
 }
 return path?`<path d="${path}" fill="none" stroke="${color}" ${dashed?'stroke-dasharray="7 5"':''} stroke-width="2.5" vector-effect="non-scaling-stroke"/>`:'';
}
function impulseMarkup(chart,location,weight,label){
 if(Math.abs(weight)<1e-12)return '';
 const x=chart.x(location),tip=chart.y(weight),base=chart.y(0),sign=weight>=0?1:-1;
 return `<line x1="${x}" x2="${x}" y1="${base}" y2="${tip}" stroke="var(--wave)" stroke-width="2.5"/><path d="M${x-5},${tip+sign*9} L${x},${tip} L${x+5},${tip+sign*9}" fill="none" stroke="var(--wave)" stroke-width="2"/><text class="plot-annotation" x="${x+8}" y="${tip+(weight>=0?-7:16)}">${label}</text>`;
}
let displayedKind=null,typesetQueue=Promise.resolve();
function updatePair(kind){
 if(displayedKind===kind)return;displayedKind=kind;
 // Serializa los cambios para no reutilizar nodos mientras MathJax los procesa.
 typesetQueue=typesetQueue.catch(()=>{}).then(async()=>{
  if(window.MathJax?.startup?.promise)await window.MathJax.startup.promise;
  const host=document.querySelector('#tf-pair');
  window.MathJax?.typesetClear?.([host]);host.textContent=signalDefinitions[displayedKind].pair;
  if(window.MathJax?.typesetPromise)await window.MathJax.typesetPromise([host]);
 });
}
function render(){
 const p=parameters(),error=document.querySelector('#tf-error');error.hidden=!!p;
 if(!p){error.textContent='Selecciona una señal válida y mantén los controles dentro de sus rangos.';return;}
 for(const name of ['amplitude','delay','scale']){const value=name==='scale'?Math.abs(p.a):p[name];document.querySelector(`#tf-${name}-value`).textContent=format.format(value);controls[name].setAttribute('aria-valuetext',format.format(value));}
 document.querySelector('#tf-summary').textContent=`A = ${format.format(p.amplitude)} · a = ${format.format(p.a)} · τ = ${format.format(p.delay)} s. ${p.amplitude===0?'Señal nula: módulo cero y fase no definida.':p.a<0?'Se aplica inversión temporal.':'Sin inversión temporal.'}`;
 const definition=signalDefinitions[p.kind],samples=2400,locations=Array.from({length:samples+1},(_,i)=>-6+12*i/samples);
 const timeWeight=p.amplitude/Math.abs(p.a),timeMax=p.kind==='delta'?Math.max(1,2/Math.abs(p.a))*1.25:2.5;
 bounds.right=770;
 const timeChart=chartFrame(-timeMax,timeMax,'Tiempo t (s)',p.kind==='delta'?'Impulso: peso (u.a.·s)':'Amplitud (u.a.)');
 document.querySelector('#tf-time').innerHTML=timeChart.markup+(p.kind==='delta'?impulseMarkup(timeChart,p.delay,timeWeight,`peso ${format.format(timeWeight)}`):curve(locations.map(t=>({x:t,y:timeValue(p,t)})),timeChart));
 if(definition.timeImag)document.querySelector('#tf-time').innerHTML+=curve(locations.map(t=>({x:t,y:timeImagValue(p,t)})),timeChart,{color:'#d97706',dashed:true});
 document.querySelector('#tf-complex-legend').hidden=!definition.timeImag;
 document.querySelector('#tf-time').setAttribute('aria-label',definition.timeImag?'Parte real e imaginaria de la exponencial compleja superpuestas entre −6 y 6 segundos':'Señal temporal entre −6 y 6 segundos');
 const combined=combineControl.checked;
 const spectrumPlot=document.getElementById('tf-magnitude'),plotBounds=spectrumPlot.getBoundingClientRect();
 const spectrumWidth=plotBounds.height>0?Math.max(320,310*plotBounds.width/plotBounds.height):800;
 spectrumPlot.setAttribute('viewBox',`0 0 ${spectrumWidth} 310`);
 const phasePlot=document.getElementById('tf-phase'),phaseBounds=phasePlot.getBoundingClientRect();
 const phaseWidth=phaseBounds.height>0?Math.max(320,310*phaseBounds.width/phaseBounds.height):spectrumWidth;
 phasePlot.setAttribute('viewBox',`0 0 ${phaseWidth} 310`);
 bounds.right=spectrumWidth-(combined?90:30);
 document.body.classList.toggle('tf-combined',combined);
 document.getElementById('tf-phase-card').hidden=combined;
 document.getElementById('tf-combined-legend').hidden=!combined;
 document.getElementById('tf-spectrum-title').textContent=combined?'Módulo y fase de Fourier':'Módulo de Fourier';
 const magnitudeRight=bounds.right;
 if(!combined)bounds.right=phaseWidth-30;
 const phaseChart=chartFrame(-Math.PI,Math.PI,'Frecuencia f (Hz)','Fase (rad)',true);
 bounds.right=magnitudeRight;
 let magnitudeMarkup,phaseMarkup;
 if(definition.atoms){
  const atoms=spectralAtoms(p),max=Math.max(1,...spectralAtoms({...p,amplitude:2}).map(z=>Math.hypot(z.re,z.im)))*1.3;
  const magnitudeChart=chartFrame(0,max,'Frecuencia f (Hz)','Impulsos: módulo del peso (u.a.)');
  magnitudeMarkup=magnitudeChart.markup+atoms.map(z=>impulseMarkup(magnitudeChart,z.f,Math.hypot(z.re,z.im),format.format(Math.hypot(z.re,z.im)))).join('');
  phaseMarkup=phaseChart.markup+atoms.filter(z=>Math.hypot(z.re,z.im)>1e-12).map(z=>`<circle cx="${phaseChart.x(z.f)}" cy="${phaseChart.y(Math.atan2(z.im,z.re))}" r="5" fill="var(--wave)"/><text class="plot-annotation" x="${phaseChart.x(z.f)+8}" y="${phaseChart.y(Math.atan2(z.im,z.re))-8}">${format.format(Math.atan2(z.im,z.re))} rad</text>`).join('');
  document.querySelector('#tf-impulse-note').textContent='Espectro de Dirac: las flechas muestran el módulo de los pesos de los impulsos. El retraso modifica su fase, no sus posiciones ni módulos.';
 }else{
  const spectrum=locations.map(f=>({x:f,...transformedSpectrum(p,f)})),max=Math.max(1e-12,...spectrum.map(z=>Math.hypot(z.re,z.im)));
  const referenceMax=Math.max(.1,...locations.map(f=>{const z=transformedSpectrum({...p,amplitude:2},f);return Math.hypot(z.re,z.im);}));
  const magnitudeChart=chartFrame(0,referenceMax*1.15,'Frecuencia f (Hz)','Módulo (u.a.·s)');
  magnitudeMarkup=magnitudeChart.markup+curve(spectrum.map(z=>({x:z.x,y:Math.hypot(z.re,z.im)})),magnitudeChart);
  phaseMarkup=phaseChart.markup+curve(spectrum.map(z=>({x:z.x,y:Math.hypot(z.re,z.im)>Math.max(1e-12,max*1e-6)?Math.atan2(z.im,z.re):null})),phaseChart,{phase:true});
  document.querySelector('#tf-impulse-note').textContent=p.kind==='sinc'?'El espectro rectangular tiene bordes en f = ±|a|/2.':'Módulo de la transformada analítica; los ejes horizontales permanecen fijos para comparar los cambios.';
 }
 if(combined){
  const phaseTrace=phaseMarkup.slice(phaseChart.markup.length).replaceAll('var(--wave)','#b45309').replaceAll('<path ', '<path stroke-dasharray="7 5" ');
  magnitudeMarkup+=phaseTrace;
  for(let i=0;i<=4;i++){
   const value=-Math.PI+i*Math.PI/2;
   magnitudeMarkup+=`<text class="tf-phase-label" x="${bounds.right+10}" y="${phaseChart.y(value)+4}" fill="#b45309" font-size="11" font-family="var(--font-mono)">${['−π','−π/2','0','π/2','π'][i]}</text>`;
  }
  magnitudeMarkup+=`<text x="${bounds.right+10}" y="18" fill="#b45309" font-size="11" font-family="var(--font-mono)">Fase (rad)</text>`;
 }
 document.querySelector('#tf-magnitude').innerHTML=magnitudeMarkup;document.querySelector('#tf-phase').innerHTML=phaseMarkup;updatePair(p.kind);
}
combineControl.addEventListener('change',render);
Object.values(controls).forEach(input=>input.addEventListener(input.tagName==='SELECT'||input.type==='checkbox'?'change':'input',render));
document.querySelector('#tf-reset').addEventListener('click',()=>{controls.delay.value=0;controls.amplitude.value=1;controls.scale.value=1;controls.invert.checked=false;render();});
render();

let tfPlotSizes='';
const tfPlotObserver=new ResizeObserver(()=>{
 const sizes=['tf-magnitude','tf-phase'].map(id=>{
  const rect=document.getElementById(id).getBoundingClientRect();
  return `${rect.width.toFixed(1)}:${rect.height.toFixed(1)}`;
 }).join('|');
 if(sizes===tfPlotSizes)return;
 tfPlotSizes=sizes;
 render();
});
for(const id of ['tf-magnitude','tf-phase'])tfPlotObserver.observe(document.getElementById(id));
