'use strict';
const bodeFields=Object.fromEntries(['gain','frequency','damping','zero','pole','delay','probe'].map(name=>[name,document.querySelector(`#bode-${name}`)]));
const magnitudeScaleSelect=document.querySelector('#bode-magnitude-scale'),frequencyScaleSelect=document.querySelector('#bode-frequency-scale');
const bodeSelect=document.querySelector('#bode-system');
const bodeCombine=document.getElementById('bode-combine');
const bodeFormat=new Intl.NumberFormat('es',{maximumFractionDigits:3});
const bodeModels={
 low:{formula:String.raw`H(s)=\frac{K}{1+s/\omega_c}`,explanation:'Paso bajo de primer orden: conserva las frecuencias bajas. En ωc el módulo vale K/√2 y la fase es −45°.'},
 high:{formula:String.raw`H(s)=K\frac{s/\omega_c}{1+s/\omega_c}`,explanation:'Paso alto de primer orden: atenúa las frecuencias bajas. En ωc el módulo vale K/√2 y la fase es +45°.'},
 secondLow:{formula:String.raw`H(s)=\frac{K\omega_0^2}{s^2+2\zeta\omega_0s+\omega_0^2}`,explanation:'Paso bajo de segundo orden: la pendiente final es −40 dB/década y la fase tiende a −180°. En ω₀ el módulo es K/(2ζ) y la fase es −90°. Si ζ < 1/√2 aparece un pico de resonancia.'},
 secondHigh:{formula:String.raw`H(s)=\frac{Ks^2}{s^2+2\zeta\omega_0s+\omega_0^2}`,explanation:'Paso alto de segundo orden: la pendiente inicial es +40 dB/década. La fase continua baja desde +180° hasta 0°. En ω₀ el módulo es K/(2ζ) y la fase es +90°.'},
 integrator:{formula:String.raw`H(s)=\frac{K}{s}`,explanation:'Integrador ideal: pendiente de −20 dB/década y fase constante de −90°. A 1 rad/s, el módulo es K.'},
 differentiator:{formula:String.raw`H(s)=Ks`,explanation:'Derivador ideal: pendiente de +20 dB/década y fase constante de +90°. A 1 rad/s, el módulo es K.'},
 polezero:{formula:String.raw`H(s)=K\frac{1+s/\omega_z}{1+s/\omega_p}`,explanation:'El cero aumenta la magnitud y adelanta la fase; el polo reduce la pendiente y retrasa la fase. Si ωz = ωp, ambos se cancelan y queda una ganancia constante K.'},
 gain:{formula:String.raw`H(s)=K`,explanation:'Una ganancia positiva modifica el módulo sin añadir fase. La magnitud es constante e igual a 20 log₁₀K.'},
 delay:{formula:String.raw`H(s)=Ke^{-sT}`,explanation:'Retardo puro: módulo constante K y fase −ωT rad. En el eje logarítmico la fase no es una recta; se muestra sin envolver para ver cómo se acumula el retraso.'}
};
function readBode(){
 if(!Object.hasOwn(bodeModels,bodeSelect.value))return null;
 const values={};let valid=true;
 for(const [name,input] of Object.entries(bodeFields)){
  const value=Number(input.value),ok=input.value.trim()!==''&&Number.isFinite(value)&&value>=Number(input.min)&&value<=Number(input.max);
  input.setAttribute('aria-invalid',String(!ok));valid=valid&&ok;values[name]=value;
 }
 return valid?{kind:bodeSelect.value,gainDb:values.gain,K:10**(values.gain/20),wc:10**values.frequency,zeta:values.damping,wz:10**values.zero,wp:10**values.pole,T:values.delay,probe:10**values.probe}:null;
}
function bodeResponse(p,w){
 const r=w/p.wc,r2=r*r,den=Math.hypot(1-r2,2*p.zeta*r),angle=Math.atan2(2*p.zeta*r,1-r2)*180/Math.PI;
 let db=0,phase=0;
 switch(p.kind){
  case 'low':db=-10*Math.log10(1+r2);phase=-Math.atan(r)*180/Math.PI;break;
  case 'high':db=20*Math.log10(r)-10*Math.log10(1+r2);phase=90-Math.atan(r)*180/Math.PI;break;
  case 'secondLow':db=-20*Math.log10(den);phase=-angle;break;
  case 'secondHigh':db=40*Math.log10(r)-20*Math.log10(den);phase=180-angle;break;
  case 'integrator':db=-20*Math.log10(w);phase=-90;break;
  case 'differentiator':db=20*Math.log10(w);phase=90;break;
  case 'polezero':db=10*Math.log10(1+(w/p.wz)**2)-10*Math.log10(1+(w/p.wp)**2);phase=(Math.atan(w/p.wz)-Math.atan(w/p.wp))*180/Math.PI;break;
  case 'delay':phase=-w*p.T*180/Math.PI;break;
 }
 return {db:p.gainDb+db,phase};
}
function bodeTicks(min,max){
 const raw=(max-min)/5,power=10**Math.floor(Math.log10(raw)),normalized=raw/power,step=(normalized<=1?1:normalized<=2?2:normalized<=5?5:10)*power;
 const ticks=[];for(let v=Math.ceil(min/step)*step;v<=max+step*1e-8;v+=step)ticks.push(Math.abs(v)<1e-10?0:v);return ticks;
}
function bodeChart(points,property,range,probe,phaseRange=null){
 const combined=phaseRange!==null,logarithmic=frequencyScaleSelect.value==='log';
 const plot=document.getElementById(property==='phase'?'bode-phase':'bode-magnitude');
 const bounds=plot.getBoundingClientRect(),height=310,width=bounds.height>0?height*bounds.width/bounds.height:800;
 plot.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const left=combined?Math.min(80,width*.2):80;
 const right=width-(combined?Math.min(90,width*.28):30),top=32,bottom=height-62;
 const x=w=>left+(logarithmic?(Math.log10(w)+2)/5:(w-.01)/(1000-.01))*(right-left);
 const y=v=>bottom-(v-range[0])/(range[1]-range[0])*(bottom-top);
 const phaseY=v=>bottom-(v-phaseRange[0])/(phaseRange[1]-phaseRange[0])*(bottom-top);
 const magnitudeColor='var(--wave)',phaseColor='#b45309';
 const tickY=height-38;
 let markup='';
 const frequencies=logarithmic?Array.from({length:6},(_,i)=>10**(i-2)):[.01,...bodeTicks(.01,1000)];
 for(const frequency of frequencies){
  markup+=`<line class="plot-grid-line" x1="${x(frequency)}" x2="${x(frequency)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(frequency)}" y="${tickY}" text-anchor="middle">${bodeFormat.format(frequency)}</text>`;
  if(logarithmic&&frequency<1000)for(let m=2;m<=9;m++)markup+=`<line class="plot-grid-line" opacity=".35" x1="${x(m*frequency)}" x2="${x(m*frequency)}" y1="${top}" y2="${bottom}"/>`;
 }
 for(const v of bodeTicks(...range))markup+=`<line class="${v===0?'plot-axis-line':'plot-grid-line'}" x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text class="plot-tick-label" ${combined?`style="fill:${magnitudeColor}"`:''} x="${left-10}" y="${y(v)+4}" text-anchor="end">${bodeFormat.format(v)}</text>`;
 if(combined){
  markup+=`<line x1="${left}" x2="${left}" y1="${top}" y2="${bottom}" stroke="${magnitudeColor}"/><line x1="${right}" x2="${right}" y1="${top}" y2="${bottom}" stroke="${phaseColor}"/>`;
  for(const v of bodeTicks(...phaseRange))markup+=`<line x1="${right}" x2="${right+5}" y1="${phaseY(v)}" y2="${phaseY(v)}" stroke="${phaseColor}"/><text class="plot-tick-label bode-phase-tick" style="fill:${phaseColor}" x="${width-8}" y="${phaseY(v)+4}" text-anchor="end">${bodeFormat.format(v)}</text>`;
 }
 const pathFor=(key,mapY)=>points.map((p,n)=>`${n?'L':'M'}${x(p.w).toFixed(2)},${mapY(p[key]).toFixed(2)}`).join(' ');
 const clipId=`bode-${property}-clip`;
 markup+=`<defs><clipPath id="${clipId}"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath></defs><g clip-path="url(#${clipId})"><path class="bode-magnitude-trace" d="${pathFor(property,y)}" fill="none" stroke="${magnitudeColor}" stroke-width="2.5"/>`;
 if(combined)markup+=`<path class="bode-phase-trace" d="${pathFor('phase',phaseY)}" fill="none" stroke="${phaseColor}" stroke-width="2.5" stroke-dasharray="10 5"/>`;
 markup+=`<line x1="${x(probe.w)}" x2="${x(probe.w)}" y1="${top}" y2="${bottom}" stroke="${combined?'var(--muted)':'#d97706'}" stroke-dasharray="5 4"/><circle class="bode-magnitude-probe" cx="${x(probe.w)}" cy="${y(probe[property])}" r="5" fill="${combined?magnitudeColor:'#d97706'}" stroke="var(--foreground)"/>`;
 if(combined)markup+=`<circle class="bode-phase-probe" cx="${x(probe.w)}" cy="${phaseY(probe.phase)}" r="5" fill="${phaseColor}" stroke="var(--foreground)"/>`;
 markup+='</g>';
 const frequencyLabel=combined?`ω (rad/s) · ${logarithmic?'log':'lineal'}`:`Frecuencia angular ω (rad/s) · escala ${logarithmic?'log':'lineal'}`;
 markup+=`<text class="plot-axis-label" x="${right}" y="${height-9}" text-anchor="end">${frequencyLabel}</text><text class="plot-axis-label" ${combined?`style="fill:${magnitudeColor}"`:''} x="12" y="18">${property==='db'?'Magnitud (dB)':property==='linear'?'Magnitud (V/V)':'Fase (°)'}</text>`;
 if(combined)markup+=`<text class="plot-axis-label bode-phase-axis" style="fill:${phaseColor}" x="${width-8}" y="18" text-anchor="end">Fase (°)</text>`;
 return markup;
}
function bodeExpressions(kind){
 const first=String.raw`r=\frac{2\pi f}{\omega_c}`,second=String.raw`r=\frac{2\pi f}{\omega_0}`;
 const expressions={
  low:[first,String.raw`\frac{K}{1+jr}`,String.raw`\frac{K}{\sqrt{1+r^2}}`,String.raw`-\arctan(r)`],
  high:[first,String.raw`\frac{Kjr}{1+jr}`,String.raw`\frac{Kr}{\sqrt{1+r^2}}`,String.raw`\frac{\pi}{2}-\arctan(r)`],
  secondLow:[second,String.raw`\frac{K}{1-r^2+j2\zeta r}`,String.raw`\frac{K}{\sqrt{(1-r^2)^2+(2\zeta r)^2}}`,String.raw`-\operatorname{atan2}(2\zeta r,1-r^2)`],
  secondHigh:[second,String.raw`\frac{-Kr^2}{1-r^2+j2\zeta r}`,String.raw`\frac{Kr^2}{\sqrt{(1-r^2)^2+(2\zeta r)^2}}`,String.raw`\pi-\operatorname{atan2}(2\zeta r,1-r^2)`],
  integrator:['',String.raw`\frac{K}{j2\pi f}`,String.raw`\frac{K}{2\pi f}`,String.raw`-\frac{\pi}{2}`],
  differentiator:['',String.raw`Kj2\pi f`,String.raw`K2\pi f`,String.raw`\frac{\pi}{2}`],
  polezero:[String.raw`r_z=\frac{2\pi f}{\omega_z},\quad r_p=\frac{2\pi f}{\omega_p}`,String.raw`K\frac{1+jr_z}{1+jr_p}`,String.raw`K\sqrt{\frac{1+r_z^2}{1+r_p^2}}`,String.raw`\arctan(r_z)-\arctan(r_p)`],
  gain:['','K','K','0'],
  delay:['',String.raw`Ke^{-j2\pi fT}`,'K',String.raw`-2\pi fT`]
 };
 return expressions[kind];
}
let bodeModelKind=null,bodeMathQueue=Promise.resolve();
function updateBodeModel(kind){
 if(kind===bodeModelKind)return;bodeModelKind=kind;
 bodeMathQueue=bodeMathQueue.catch(()=>{}).then(async()=>{
  if(window.MathJax?.startup?.promise)await window.MathJax.startup.promise;
  const host=document.querySelector('#bode-expressions'),[variable,frequency,modulus,phase]=bodeExpressions(bodeModelKind);
  window.MathJax?.typesetClear?.([host]);
  for(const [id,formula] of [['bode-expression-variable',variable],['bode-model',bodeModels[bodeModelKind].formula],['bode-frequency-expression',`H(f)=${frequency}`],['bode-modulus-expression',`|H(f)|=${modulus}`],['bode-phase-expression',`\\varphi(f)=${phase}`]])document.getElementById(id).textContent=formula?`\\[${formula}\\]`:'';
  if(window.MathJax?.typesetPromise)await window.MathJax.typesetPromise([host]);
 });
}
function renderBode(){
 const combined=bodeCombine.checked;
 document.body.classList.toggle('bode-combined',combined);
 document.getElementById('bode-phase-card').hidden=combined;
 document.getElementById('bode-combined-legend').hidden=!combined;
 document.getElementById('bode-chart-title').textContent=combined?'Magnitud y fase':'Magnitud';
 const p=readBode(),error=document.querySelector('#bode-error');error.hidden=!!p;
 if(!p){error.textContent='Revisa los parámetros y mantenlos dentro de los rangos indicados.';return;}
 const second=['secondLow','secondHigh'].includes(p.kind);
 for(const [name,visible] of [['frequency',['low','high'].includes(p.kind)||second],['damping',second],['zero',p.kind==='polezero'],['pole',p.kind==='polezero'],['delay',p.kind==='delay']]){
  const group=document.querySelector(`#bode-${name}-control`);group.hidden=!visible;bodeFields[name].disabled=!visible;
 }
 document.querySelector('#bode-frequency-label').textContent=second?'Frecuencia natural ω₀':'Frecuencia de corte ωc';
 for(const [name,value,unit] of [['gain',p.gainDb,'dB'],['frequency',p.wc,'rad/s'],['damping',p.zeta,''],['zero',p.wz,'rad/s'],['pole',p.wp,'rad/s'],['delay',p.T,'s'],['probe',p.probe,'rad/s']]){
  const label=`${bodeFormat.format(value)} ${unit}`.trim();document.querySelector(`#bode-${name}-value`).textContent=label;bodeFields[name].setAttribute('aria-valuetext',label);
 }
 const points=Array.from({length:1001},(_,i)=>{const w=10**(-2+5*i/1000);const response=bodeResponse(p,w);return {w,...response,linear:10**(response.db/20)};}),probe={w:p.probe,...bodeResponse(p,p.probe)};
 probe.linear=10**(probe.db/20);
 const reference=points.map(v=>bodeResponse({...p,gainDb:0},v.w).db);
 const dbMin=Math.floor((Math.min(...reference)-20)/20)*20,dbMax=Math.ceil((Math.max(...reference)+20)/20)*20;
 const minPhase=Math.min(0,...points.map(v=>v.phase)),maxPhase=Math.max(0,...points.map(v=>v.phase)),padding=Math.max(15,(maxPhase-minPhase)*.07);
 const linear=magnitudeScaleSelect.value==='linear';
 const magnitudeRange=linear?[0,Math.max(...reference.map(db=>10**((db+20)/20)))*1.1]:[dbMin,dbMax];
 const phaseRange=[minPhase-padding,maxPhase+padding];
 document.querySelector('#bode-magnitude').innerHTML=bodeChart(points,linear?'linear':'db',magnitudeRange,probe,combined?phaseRange:null);
 document.querySelector('#bode-magnitude').setAttribute('aria-label',`Magnitud en ${linear?'escala lineal V/V':'decibelios'}${combined?', eje izquierdo; fase en grados, eje derecho':''}, frente a frecuencia angular en escala ${frequencyScaleSelect.value==='log'?'logarítmica':'lineal'}`);
 document.querySelector('#bode-phase').setAttribute('aria-label',`Fase continua en grados frente a frecuencia angular en escala ${frequencyScaleSelect.value==='log'?'logarítmica':'lineal'}`);
 if(!combined)document.querySelector('#bode-phase').innerHTML=bodeChart(points,'phase',phaseRange,probe);
 const rows=[['Frecuencia angular',`${bodeFormat.format(p.probe)} rad/s`],['Frecuencia',`${bodeFormat.format(p.probe/(2*Math.PI))} Hz`],['Magnitud',`${bodeFormat.format(probe.db)} dB`],['Ganancia de amplitud',`${bodeFormat.format(10**(probe.db/20))} V/V`],['Fase continua',`${bodeFormat.format(probe.phase)}°`]];
 document.querySelector('#bode-readouts').innerHTML=rows.map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
 document.querySelector('#bode-explanation').textContent=bodeModels[p.kind].explanation;updateBodeModel(p.kind);
}
bodeCombine.addEventListener('change',renderBode);
magnitudeScaleSelect.addEventListener('change',renderBode);frequencyScaleSelect.addEventListener('change',renderBode);
bodeSelect.addEventListener('change',renderBode);Object.values(bodeFields).forEach(input=>input.addEventListener('input',renderBode));
document.querySelector('#bode-reset').addEventListener('click',()=>{for(const [name,value] of Object.entries({gain:0,frequency:1,damping:.5,zero:0,pole:1,delay:.1,probe:1}))bodeFields[name].value=value;renderBode();});
renderBode();


const bodeShowMeasures=document.getElementById('bode-show-measures');
bodeShowMeasures.addEventListener('change',()=>{
 document.getElementById('bode-measures-card').hidden=!bodeShowMeasures.checked;
 document.body.classList.toggle('bode-measures-hidden',!bodeShowMeasures.checked);
 renderBode();
});
let bodePlotSize='';
const bodeResizeObserver=new ResizeObserver(()=>{
 const size=['bode-magnitude','bode-phase'].map(id=>{
  const box=document.getElementById(id).getBoundingClientRect();
  return `${box.width.toFixed(2)}:${box.height.toFixed(2)}`;
 }).join('|');
 if(size===bodePlotSize)return;
 bodePlotSize=size;
 renderBode();
});
for(const id of ['bode-magnitude','bode-phase'])bodeResizeObserver.observe(document.getElementById(id));
