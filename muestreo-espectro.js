'use strict';
const ssBandwidth=document.querySelector('#ss-bandwidth'),ssRate=document.querySelector('#ss-rate'),ssNormalize=document.querySelector('#ss-normalize');
const ssAntialias=document.querySelector('#ss-antialias');
const ssFormat=new Intl.NumberFormat('es',{maximumFractionDigits:3});
const triangle=(f,B)=>Math.max(0,1-Math.abs(f)/B);
function filteredTriangle(f,B,fs,antialias=false,side=0){
 const value=triangle(f,B);if(!antialias)return value;
 const edge=Math.abs(f)-fs/2;
 if(Math.abs(edge)<1e-9)return value*(side===0?.5:side*f<0?1:0);
 return edge<0?value:0;
}
function sampledSpectrum(f,B,fs,normalized=true,antialias=false,side=0){
 const first=Math.ceil((f-B)/fs),last=Math.floor((f+B)/fs);let sum=0;
 for(let k=first;k<=last;k++)sum+=filteredTriangle(f-k*fs,B,fs,antialias,side);
 return sum*(normalized?1:fs);
}
function spectrumGeometry(B,fs,antialias=false){
 const width=antialias?Math.min(B,fs/2):B;
 const replicas=[];
 for(let k=Math.ceil((-20-width)/fs);k<=Math.floor((20+width)/fs);k++)replicas.push(k);
 const knots=[-20,20];
 for(const k of replicas)for(const f of [k*fs-width,k*fs,k*fs+width])if(f>-20&&f<20)knots.push(f);
 const frequencies=[...new Set(knots)].sort((a,b)=>a-b),overlaps=[];
 for(let i=1;i<frequencies.length;i++){
  const a=frequencies[i-1],b=frequencies[i],mid=(a+b)/2;
  if(replicas.filter(k=>triangle(mid-k*fs,width)>1e-10).length>1){
   const previous=overlaps.at(-1);if(previous&&Math.abs(previous[1]-a)<1e-8)previous[1]=b;else overlaps.push([a,b]);
  }
 }
 return {replicas,frequencies,overlaps};
}
function ssFrame(max,label,id){
 const svg=document.getElementById(id),bounds=svg.getBoundingClientRect();
 const width=bounds.height>0?Math.max(320,330*bounds.width/bounds.height):800;
 svg.setAttribute('viewBox',`0 0 ${width} 330`);
 const left=70,right=width-30,top=40,bottom=260,x=f=>left+(f+20)/40*(right-left),y=v=>bottom-v/max*(bottom-top);let markup='';
 for(let f=-20;f<=20;f+=5)markup+=`<line class="${f===0?'plot-axis-line':'plot-grid-line'}" x1="${x(f)}" x2="${x(f)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(f)}" y="284" text-anchor="middle">${f}</text>`;
 const raw=max/5,power=10**Math.floor(Math.log10(raw)),ratio=raw/power,step=(ratio<=1?1:ratio<=2?2:ratio<=5?5:10)*power;
 for(let i=0;i*step<=max+1e-10;i++){const value=i*step;markup+=`<line class="${i===0?'plot-axis-line':'plot-grid-line'}" x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}"/><text class="plot-tick-label" x="60" y="${y(value)+4}" text-anchor="end">${ssFormat.format(value)}</text>`;}
 markup+=`<text class="plot-axis-label" x="${right}" y="317" text-anchor="end">Frecuencia f (Hz)</text><text class="plot-axis-label" x="12" y="18">${label}</text>`;
 return {x,y,markup};
}
function ssPath(points,frame,color,width=2,dashed=false){
 const path=points.map((p,i)=>`${i?'L':'M'}${frame.x(p.f).toFixed(2)},${frame.y(p.value).toFixed(2)}`).join(' ');
 return `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" ${dashed?'stroke-dasharray="7 4"':''} vector-effect="non-scaling-stroke"/>`;
}
function replicaPoints(k,B,fs,normalized,antialias){
 const width=antialias?Math.min(B,fs/2):B,center=k*fs,left=center-width,right=center+width;
 const first=Math.max(-20,left),last=Math.min(20,right),factor=normalized?1:fs;
 const points=[{f:first,value:first===left?0:triangle(first-center,B)*factor}];
 if(first===left)points.push({f:first,value:triangle(-width,B)*factor});
 if(center>first&&center<last)points.push({f:center,value:factor});
 points.push({f:last,value:triangle(last-center,B)*factor});
 if(last===right)points.push({f:last,value:0});
 return points;
}
function renderSamplingSpectrum(){
 const B=Number(ssBandwidth.value),fs=Number(ssRate.value),normalized=ssNormalize.checked,antialias=ssAntialias.checked,error=document.querySelector('#ss-error');
 const valid=Number.isFinite(B)&&B>=.5&&B<=5&&Number.isFinite(fs)&&fs>=.5&&fs<=20;error.hidden=valid;
 if(!valid){error.textContent='El ancho de banda debe estar entre 0,5 y 5 Hz y el muestreo entre 0,5 y 20 Hz.';return;}
 for(const [input,id,value]of [[ssBandwidth,'ss-bandwidth-value',B],[ssRate,'ss-rate-value',fs]]){const label=`${ssFormat.format(value)} Hz`;document.getElementById(id).textContent=label;input.setAttribute('aria-valuetext',label);}
 const {replicas,frequencies,overlaps}=spectrumGeometry(B,fs,antialias),sum=frequencies.map(f=>({f,value:sampledSpectrum(f,B,fs,normalized,antialias)}));
 // Ambas gráficas comparten escala vertical y horizontal; todos los vértices son exactos.
 const ymax=Math.max(1,...sum.map(p=>p.value))*1.25,original=ssFrame(ymax,'X(f) (u.a.·s)','ss-original'),sampled=ssFrame(ymax,normalized?'TₛXₛ(f) (u.a.·s)':'Xₛ(f) (u.a.)','ss-sampled');
 document.querySelector('#ss-original').innerHTML=original.markup+ssPath([{f:-20,value:0},{f:-B,value:0},{f:0,value:1},{f:B,value:0},{f:20,value:0}],original,'var(--wave)',3)+[-B,B].map(f=>`<line x1="${original.x(f)}" x2="${original.x(f)}" y1="40" y2="260" stroke="var(--muted)" stroke-dasharray="3 5"/><text class="plot-annotation" x="${original.x(f)+(f<0?-4:4)}" y="34" text-anchor="${f<0?'end':'start'}">${f<0?'−B':'+B'}</text>`).join('');
 if(antialias)document.querySelector('#ss-original').innerHTML+=ssPath(replicaPoints(0,B,fs,true,true),original,'#15803d',3,true);
 let markup=overlaps.map(([a,b])=>`<rect x="${sampled.x(a)}" y="40" width="${sampled.x(b)-sampled.x(a)}" height="220" fill="#e11d48" opacity=".12"/>`).join('')+sampled.markup;
 markup+=ssPath(sum,sampled,'#a855f7',4);
 for(const k of replicas){
  const points=replicaPoints(k,B,fs,normalized,antialias);
  markup+=ssPath(points,sampled,k===0?'var(--wave)':'#d97706',k===0?2.5:1.8,k!==0);
 }
 for(const f of [-fs/2,fs/2])markup+=`<line x1="${sampled.x(f)}" x2="${sampled.x(f)}" y1="40" y2="260" stroke="#15803d" stroke-width="2" stroke-dasharray="4 5"/><text class="plot-annotation" x="${sampled.x(f)+(f<0?-4:4)}" y="32" text-anchor="${f<0?'end':'start'}">${f<0?'−fₛ/2':'+fₛ/2'}</text>`;
 document.querySelector('#ss-sampled').innerHTML=markup;
 const atLimit=Math.abs(fs-2*B)<1e-8;
 document.querySelector('#ss-state').textContent=antialias?(fs<2*B?'Filtro antialiasing activo: sin solapamiento; se eliminan las frecuencias originales por encima de fₛ/2.':'Filtro antialiasing activo: sin solapamiento; el espectro original se conserva.'):atLimit?'Límite de Nyquist: fₛ = 2B. Las réplicas se tocan donde su amplitud es cero.':fs>2*B?'Sin aliasing: fₛ > 2B. Las réplicas están separadas.':'Hay aliasing: fₛ < 2B. Las réplicas se solapan en las zonas sombreadas.';
 document.querySelector('#ss-scale-note').textContent=normalized?'Se muestra TₛXₛ(f): cada réplica conserva altura 1. Ambas gráficas tienen las mismas escalas.':'Se muestra Xₛ(f): cada réplica tiene altura fₛ por el factor del muestreo ideal. Ambas gráficas tienen la misma escala numérica; sus unidades verticales son distintas.';
 const rows=[['Frecuencia de muestreo',`${ssFormat.format(fs)} Hz`],['Periodo de muestreo',`${ssFormat.format(1/fs)} s`],['Umbral de Nyquist 2B',`${ssFormat.format(2*B)} Hz`],['Solapamiento entre copias vecinas',`${ssFormat.format(antialias?0:Math.max(0,2*B-fs))} Hz`]];
 if(antialias)rows.push(['Corte del filtro',`${ssFormat.format(fs/2)} Hz`],['Banda original eliminada (por lado)',`${ssFormat.format(Math.max(0,B-fs/2))} Hz`]);
 document.querySelector('#ss-readouts').innerHTML=rows.map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
}
ssAntialias.addEventListener('change',renderSamplingSpectrum);
ssBandwidth.addEventListener('input',renderSamplingSpectrum);ssRate.addEventListener('input',renderSamplingSpectrum);ssNormalize.addEventListener('change',renderSamplingSpectrum);
for(const [id,factor] of [['ss-separated',3],['ss-limit',2],['ss-overlap',1.5]])document.getElementById(id).addEventListener('click',()=>{ssRate.value=Number(ssBandwidth.value)*factor;renderSamplingSpectrum();});
renderSamplingSpectrum();

let ssPlotSizes='';
const ssResizeObserver=new ResizeObserver(()=>{
 const sizes=['ss-original','ss-sampled'].map(id=>{
  const box=document.getElementById(id).getBoundingClientRect();
  return `${box.width.toFixed(1)}:${box.height.toFixed(1)}`;
 }).join('|');
 if(sizes===ssPlotSizes)return;
 ssPlotSizes=sizes;
 renderSamplingSpectrum();
});
for(const id of ['ss-original','ss-sampled'])ssResizeObserver.observe(document.getElementById(id));
