'use strict';
const bodeFields=Object.fromEntries(['gain','frequency','damping','zero','pole','delay','probe'].map(name=>[name,document.querySelector(`#bode-${name}`)]));
const magnitudeScaleSelect=document.querySelector('#bode-magnitude-scale'),frequencyScaleSelect=document.querySelector('#bode-frequency-scale');
const bodeSelect=document.querySelector('#bode-system');
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
function bodeChart(points,property,range,probe){
 const logarithmic=frequencyScaleSelect.value==='log';
 const left=80,right=770,top=32,bottom=248,x=w=>left+(logarithmic?(Math.log10(w)+2)/5:(w-.01)/(1000-.01))*(right-left),y=v=>bottom-(v-range[0])/(range[1]-range[0])*(bottom-top);
 let markup='';
 if(logarithmic)for(let decade=-2;decade<=3;decade++){
  const frequency=10**decade;
  markup+=`<line class="plot-grid-line" x1="${x(frequency)}" x2="${x(frequency)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(frequency)}" y="272" text-anchor="middle">${bodeFormat.format(frequency)}</text>`;
  if(decade<3)for(let m=2;m<=9;m++)markup+=`<line class="plot-grid-line" opacity=".35" x1="${x(m*frequency)}" x2="${x(m*frequency)}" y1="${top}" y2="${bottom}"/>`;
 }
 else for(const frequency of [.01,...bodeTicks(.01,1000)])markup+=`<line class="plot-grid-line" x1="${x(frequency)}" x2="${x(frequency)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(frequency)}" y="272" text-anchor="middle">${bodeFormat.format(frequency)}</text>`;
 for(const v of bodeTicks(...range))markup+=`<line class="${v===0?'plot-axis-line':'plot-grid-line'}" x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text class="plot-tick-label" x="${left-10}" y="${y(v)+4}" text-anchor="end">${bodeFormat.format(v)}</text>`;
 const path=points.map((p,n)=>`${n?'L':'M'}${x(p.w).toFixed(2)},${y(p[property]).toFixed(2)}`).join(' ');
 markup+=`<path d="${path}" fill="none" stroke="var(--wave)" stroke-width="2.5"/><line x1="${x(probe.w)}" x2="${x(probe.w)}" y1="${top}" y2="${bottom}" stroke="#d97706" stroke-dasharray="5 4"/><circle cx="${x(probe.w)}" cy="${y(probe[property])}" r="5" fill="#d97706" stroke="var(--foreground)"/><text class="plot-axis-label" x="${right}" y="301" text-anchor="end">Frecuencia angular ω (rad/s) · escala ${logarithmic?'log':'lineal'}</text><text class="plot-axis-label" x="12" y="18">${property==='db'?'Magnitud (dB)':property==='linear'?'Magnitud (V/V)':'Fase (°)'}</text>`;
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
 document.querySelector('#bode-magnitude').innerHTML=bodeChart(points,linear?'linear':'db',linear?[0,Math.max(...reference.map(db=>10**((db+20)/20)))*1.1]:[dbMin,dbMax],probe);
 document.querySelector('#bode-magnitude').setAttribute('aria-label',`Magnitud en ${linear?'escala lineal V/V':'decibelios'} frente a frecuencia angular en escala ${frequencyScaleSelect.value==='log'?'logarítmica':'lineal'}`);
 document.querySelector('#bode-phase').setAttribute('aria-label',`Fase continua en grados frente a frecuencia angular en escala ${frequencyScaleSelect.value==='log'?'logarítmica':'lineal'}`);
 document.querySelector('#bode-phase').innerHTML=bodeChart(points,'phase',[minPhase-padding,maxPhase+padding],probe);
 const rows=[['Frecuencia angular',`${bodeFormat.format(p.probe)} rad/s`],['Frecuencia',`${bodeFormat.format(p.probe/(2*Math.PI))} Hz`],['Magnitud',`${bodeFormat.format(probe.db)} dB`],['Ganancia de amplitud',`${bodeFormat.format(10**(probe.db/20))} V/V`],['Fase continua',`${bodeFormat.format(probe.phase)}°`]];
 document.querySelector('#bode-readouts').innerHTML=rows.map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
 document.querySelector('#bode-explanation').textContent=bodeModels[p.kind].explanation;updateBodeModel(p.kind);
}
magnitudeScaleSelect.addEventListener('change',renderBode);frequencyScaleSelect.addEventListener('change',renderBode);
bodeSelect.addEventListener('change',renderBode);Object.values(bodeFields).forEach(input=>input.addEventListener('input',renderBode));
document.querySelector('#bode-reset').addEventListener('click',()=>{for(const [name,value] of Object.entries({gain:0,frequency:1,damping:.5,zero:0,pole:1,delay:.1,probe:1}))bodeFields[name].value=value;renderBode();});
renderBode();
