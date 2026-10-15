'use strict';
function fft(samples, imaginary = null) {
  const count = samples.length;
  if (count < 2 || (count & (count - 1)) !== 0) throw new Error("La FFT necesita una potencia de dos de muestras.");
  const real = Float64Array.from(samples);
  const imag = imaginary ? Float64Array.from(imaginary) : new Float64Array(count);
  for (let i = 1, j = 0; i < count; i += 1) {
    let bit = count >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let length = 2; length <= count; length *= 2) {
    const angle = -2 * Math.PI / length;
    for (let start = 0; start < count; start += length) {
      for (let j = 0; j < length / 2; j += 1) {
        const cosine = Math.cos(angle * j);
        const sine = Math.sin(angle * j);
        const odd = start + j + length / 2;
        const even = start + j;
        const oddReal = real[odd] * cosine - imag[odd] * sine;
        const oddImag = real[odd] * sine + imag[odd] * cosine;
        real[odd] = real[even] - oddReal;
        imag[odd] = imag[even] - oddImag;
        real[even] += oddReal;
        imag[even] += oddImag;
      }
    }
  }
  return { real, imag };
}

const fftFs=1024;
const fftFields=Object.fromEntries(['f1','a1','f2','a2'].map(name=>[name,document.querySelector(`#fft-${name}`)]));
const fftCount=document.querySelector('#fft-count'),fftWindow=document.querySelector('#fft-window'),fftScale=document.querySelector('#fft-scale');
const fftFormat=new Intl.NumberFormat('es',{maximumFractionDigits:3});
function windowWeights(kind,count){
 return Array.from({length:count},(_,n)=>{
  const phase=2*Math.PI*n/count;
  switch(kind){case 'rect':return 1;case 'hann':return .5-.5*Math.cos(phase);case 'hamming':return .54-.46*Math.cos(phase);case 'blackman':return .42-.5*Math.cos(phase)+.08*Math.cos(2*phase);case 'flattop':return .21557895-.41663158*Math.cos(phase)+.277263158*Math.cos(2*phase)-.083578947*Math.cos(3*phase)+.006947368*Math.cos(4*phase);default:throw new Error('Ventana no admitida.');}
 });
}
function fftParameters(){
 const p={count:Number(fftCount.value),window:fftWindow.value,scale:fftScale.value};let valid=true;
 for(const [name,input]of Object.entries(fftFields)){const value=Number(input.value),ok=input.value.trim()!==''&&Number.isFinite(value)&&value>=Number(input.min)&&value<=Number(input.max);input.setAttribute('aria-invalid',String(!ok));valid=valid&&ok;p[name]=value;}
 return valid&&[64,128,256,512,1024,2048,4096].includes(p.count)&&['rect','hann','hamming','blackman','flattop'].includes(p.window)&&['db','linear'].includes(p.scale)?p:null;
}
function analyzeTones(p){
 const weights=windowWeights(p.window,p.count),sum=weights.reduce((a,b)=>a+b,0),samples=Array.from({length:p.count},(_,n)=>p.a1*Math.sin(2*Math.PI*p.f1*n/fftFs)+p.a2*Math.sin(2*Math.PI*p.f2*n/fftFs)),weighted=samples.map((v,n)=>v*weights[n]),transformed=fft(weighted);
 const spectrum=Array.from({length:p.count/2+1},(_,k)=>({frequency:k*fftFs/p.count,amplitude:Math.hypot(transformed.real[k],transformed.imag[k])*(k===0||k===p.count/2?1:2)/sum}));
 return {weights,samples,weighted,spectrum,gain:sum/p.count,enbw:fftFs*weights.reduce((a,b)=>a+b*b,0)/(sum*sum)};
}
function fftTicks(min,max){
 const raw=(max-min)/5,pow=10**Math.floor(Math.log10(raw)),r=raw/pow,step=(r<=1?1:r<=2?2:r<=5?5:10)*pow,values=[];
 for(let v=Math.ceil(min/step)*step;v<=max+step*1e-9;v+=step)values.push(Math.abs(v)<1e-10?0:v);return values;
}
function fftChart(curves,xmax,yrange,xlabel,ylabel,markers=[]){
 const left=75,right=770,top=45,bottom=245,x=v=>left+v/xmax*(right-left),y=v=>bottom-(v-yrange[0])/(yrange[1]-yrange[0])*(bottom-top);let markup='';
 for(const v of fftTicks(0,xmax))markup+=`<line class="plot-grid-line" x1="${x(v)}" x2="${x(v)}" y1="${top}" y2="${bottom}"/><text class="plot-tick-label" x="${x(v)}" y="269" text-anchor="middle">${fftFormat.format(v)}</text>`;
 for(const v of fftTicks(...yrange))markup+=`<line class="${v===0?'plot-axis-line':'plot-grid-line'}" x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text class="plot-tick-label" x="${left-10}" y="${y(v)+4}" text-anchor="end">${fftFormat.format(v)}</text>`;
 for(const c of curves){const path=c.points.map((p,n)=>`${n?'L':'M'}${x(p.x).toFixed(2)},${y(p.y).toFixed(2)}`).join(' ');markup+=`<path d="${path}" fill="none" stroke="${c.color}" stroke-width="2" ${c.dashed?'stroke-dasharray="7 4"':''}/>`;}
 for(const [n,marker]of markers.entries())markup+=`<line x1="${x(marker.frequency)}" x2="${x(marker.frequency)}" y1="${top}" y2="${bottom}" stroke="var(--muted)" stroke-dasharray="3 5"/><text class="plot-annotation" x="${Math.max(left+35,Math.min(right-35,x(marker.frequency)))}" y="${20+n*16}" text-anchor="middle">f${n+1} = ${fftFormat.format(marker.frequency)} Hz</text>`;
 markup+=`<text class="plot-axis-label" x="${right}" y="298" text-anchor="end">${xlabel}</text><text class="plot-axis-label" x="12" y="14">${ylabel}</text>`;return markup;
}
function renderFFT(){
 const p=fftParameters(),error=document.querySelector('#fft-error');error.hidden=!!p;
 if(!p){error.textContent='Revisa las frecuencias (1–500 Hz), amplitudes (0–2), tamaño y tipo de ventana.';return;}
 for(const name of Object.keys(fftFields)){const label=`${fftFormat.format(p[name])} ${name.startsWith('f')?'Hz':'u.a.'}`;document.querySelector(`#fft-${name}-value`).textContent=label;fftFields[name].setAttribute('aria-valuetext',label);}
 const result=analyzeTones(p),df=fftFs/p.count;
 document.querySelector('#fft-time-plot').innerHTML=fftChart([{points:result.samples.map((v,n)=>({x:n/fftFs,y:v})),color:'var(--wave)'},{points:result.weighted.map((v,n)=>({x:n/fftFs,y:v})),color:'#d97706',dashed:true}],p.count/fftFs,[-4.5,4.5],'Tiempo (s)','Amplitud (u.a.)');
 document.querySelector('#fft-window-plot').innerHTML=fftChart([{points:result.weights.map((v,n)=>({x:n,y:v})),color:'var(--wave)'}],p.count-1,[-.1,1.2],'Índice de muestra n','Ventana (sin unidades)');
 const db=p.scale==='db',points=result.spectrum.map(bin=>({x:bin.frequency,y:db?Math.max(-140,20*Math.log10(Math.max(1e-15,bin.amplitude))):bin.amplitude}));
 document.querySelector('#fft-spectrum-plot').innerHTML=fftChart([{points,color:'var(--wave)'}],fftFs/2,db?[-140,24]:[0,12],'Frecuencia (Hz)',db?'Amplitud (dB re 1 u.a.)':'Amplitud (u.a.)',[{frequency:p.f1},{frequency:p.f2}]);
 const rows=[['Muestreo / Nyquist',`${fftFs} / ${fftFs/2} Hz`],['Número de muestras',String(p.count)],['Duración N/fₛ',`${fftFormat.format(p.count/fftFs)} s`],['Separación entre bins Δf',`${fftFormat.format(df)} Hz`],['Ganancia coherente',fftFormat.format(result.gain)],['ENBW',`${fftFormat.format(result.enbw)} Hz · ${fftFormat.format(result.enbw/df)} bins`],['Bin teórico de f₁',fftFormat.format(p.f1/df)],['Bin teórico de f₂',fftFormat.format(p.f2/df)]];
 document.querySelector('#fft-readouts').innerHTML=rows.map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
 const coherent=[1,2].filter(i=>p[`a${i}`]>0).every(i=>Math.abs(p[`f${i}`]/df-Math.round(p[`f${i}`]/df))<1e-9);
 document.querySelector('#fft-note').textContent=p.a1===0&&p.a2===0?'Ambas amplitudes son cero: la señal y su FFT son nulas.':`${coherent?'Los tonos activos coinciden con bins.':'Algún tono activo cae entre bins: observa la fuga y el error en el pico de amplitud.'} Las líneas verticales marcan las frecuencias introducidas, no los picos estimados.`;
}
Object.values(fftFields).forEach(input=>input.addEventListener('input',renderFFT));for(const input of [fftCount,fftWindow,fftScale])input.addEventListener('change',renderFFT);
document.querySelector('#fft-coherent').addEventListener('click',()=>{
 const p=fftParameters();if(!p)return;
 let a=fftFs,b=p.count;while(b){const remainder=a%b;a=b;b=remainder;}
 const spacing=fftFs/a;
 for(const name of ['f1','f2'])fftFields[name].value=Math.max(1,Math.min(Math.floor(500/spacing),Math.round(p[name]/spacing)))*spacing;renderFFT();
});
document.querySelector('#fft-reset').addEventListener('click',()=>{for(const [name,value]of Object.entries({f1:64,f2:80,a1:1,a2:.5}))fftFields[name].value=value;fftCount.value=256;fftWindow.value='hann';fftScale.value='db';renderFFT();});
renderFFT();
