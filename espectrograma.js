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

function windowWeights(kind,count){
 return Array.from({length:count},(_,n)=>{
  const phase=2*Math.PI*n/count;
  switch(kind){case 'rect':return 1;case 'hann':return .5-.5*Math.cos(phase);case 'hamming':return .54-.46*Math.cos(phase);case 'blackman':return .42-.5*Math.cos(phase)+.08*Math.cos(2*phase);case 'flattop':return .21557895-.41663158*Math.cos(phase)+.277263158*Math.cos(2*phase)-.083578947*Math.cos(3*phase)+.006947368*Math.cos(4*phase);default:throw new Error('Ventana no admitida.');}
 });
}
const spFs=8000;
const spFields=Object.fromEntries(['signal','dtmf','count','window','overlap','fmax','volume'].map(name=>[name,document.querySelector(`#sp-${name}`)]));
const spPlay=document.querySelector('#sp-play'),spStop=document.querySelector('#sp-stop'),spFormat=new Intl.NumberFormat('es',{maximumFractionDigits:3});
const dtmfRows=['123A','456B','789C','*0#D'],dtmfLow=[697,770,852,941],dtmfHigh=[1209,1336,1477,1633];
const spExamples={dtmf:'Cada pulsación DTMF combina una frecuencia de fila y otra de columna, con 100 ms de separación entre teclas.',chirp:'Chirp lineal: la frecuencia sube de 300 a 3000 Hz durante 4 s.',crossing:'Dos chirps simultáneos de 300 a 2200 Hz y de 2200 a 300 Hz. Se cruzan a los 2 s.',steps:'Cuatro tonos consecutivos de 400, 800, 1200 y 1800 Hz, de un segundo cada uno.',bursts:'Tres pulsos cortos de un tono de 1000 Hz: compara cuánto se extienden al aumentar la ventana.',am:'Tono de 1000 Hz modulado en amplitud a 50 Hz: aparecen bandas laterales en 950 y 1050 Hz.',harmonics:'Fundamental que aumenta de 120 a 240 Hz, con seis armónicos cuyas amplitudes disminuyen con el orden.'};
function dtmfFrequencies(key){const row=dtmfRows.findIndex(r=>r.includes(key));if(row<0)throw new Error('Tecla DTMF no válida.');return [dtmfLow[row],dtmfHigh[dtmfRows[row].indexOf(key)]];}
function fadeAt(t,duration,edge=.005){const ratio=Math.max(0,Math.min(1,t/edge,(duration-t)/edge));return .5-.5*Math.cos(Math.PI*ratio);}
function generateExample(kind,sequence){
 if(!Object.hasOwn(spExamples,kind))throw new Error('Selecciona una señal de ejemplo válida.');
 if(kind==='dtmf'&&!/^[0-9ABCD*#]{1,16}$/.test(sequence))throw new Error('Introduce de 1 a 16 teclas: 0–9, A–D, * o #, sin espacios.');
 const duration=kind==='dtmf'?sequence.length*.35:4,samples=new Float32Array(Math.round(duration*spFs));
 for(let n=0;n<samples.length;n++){
  const t=n/spFs;let value=0;
  switch(kind){
   case 'dtmf':{const slot=Math.floor(n/2800),local=(n%2800)/spFs;if(local<.25){const [low,high]=dtmfFrequencies(sequence[slot]);value=.35*(Math.sin(2*Math.PI*low*local)+Math.sin(2*Math.PI*high*local))*fadeAt(local,.25);}break;}
   case 'chirp':value=.7*Math.sin(2*Math.PI*(300*t+.5*(2700/4)*t*t));break;
   case 'crossing':value=.35*(Math.sin(2*Math.PI*(300*t+.5*(1900/4)*t*t))+Math.sin(2*Math.PI*(2200*t-.5*(1900/4)*t*t)));break;
   case 'steps':{const frequencies=[400,800,1200,1800],slot=Math.min(3,Math.floor(t)),local=t-slot;value=.7*Math.sin(2*Math.PI*frequencies[slot]*local)*fadeAt(local,1);break;}
   case 'bursts':for(const start of [.5,1.7,2.9])if(t>=start&&t<start+.15)value=.7*Math.sin(2*Math.PI*1000*(t-start))*fadeAt(t-start,.15);break;
   case 'am':value=.4*(1+.75*Math.cos(2*Math.PI*50*t))*Math.sin(2*Math.PI*1000*t);break;
   case 'harmonics':for(let h=1;h<=6;h++)value+=(.28/h)*Math.sin(2*Math.PI*h*(120*t+.5*30*t*t));break;
  }
  samples[n]=value*(kind==='dtmf'||kind==='steps'||kind==='bursts'?1:fadeAt(t,duration,.01));
 }
 return {kind,sequence,duration:samples.length/spFs,samples};
}
function analyzeSpectrogram(samples,count,kind,overlap){
 const hop=Math.max(1,Math.round(count*(1-overlap/100))),frames=Math.ceil(samples.length/hop)+1,bins=count/2+1,weights=windowWeights(kind,count),sum=weights.reduce((a,b)=>a+b,0),levels=new Float32Array(frames*bins),segment=new Float64Array(count);
 for(let m=0;m<frames;m++){
  const start=m*hop-count/2;
  for(let n=0;n<count;n++)segment[n]=(samples[start+n]??0)*weights[n];
  const transformed=fft(segment);
  for(let k=0;k<bins;k++){const amplitude=Math.hypot(transformed.real[k],transformed.imag[k])*(k===0||k===count/2?1:2)/sum;levels[m*bins+k]=Math.max(-100,20*Math.log10(Math.max(1e-12,amplitude)));}
 }
 return {count,hop,frames,bins,levels};
}
let spSelectedTime=.125;
let spSignal=null,spAnalysis=null,spTimer=null,spGeneration=0,spAudio=null,spSource=null,spGain=null,spOffset=0,spStarted=0,spAudioToken=0;
const spPalette=Array.from({length:256},(_,n)=>{
 const colors=[[9,16,38],[25,48,113],[19,128,164],[62,197,151],[249,227,93]],position=n/255*(colors.length-1),i=Math.min(colors.length-2,Math.floor(position)),ratio=position-i;
 return colors[i].map((value,c)=>Math.round(value*(1-ratio)+colors[i+1][c]*ratio));
});
function spectrogramImage(analysis,fmax){
 const height=Math.floor(fmax*analysis.count/spFs)+1,canvas=document.createElement('canvas');canvas.width=analysis.frames;canvas.height=height;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('El navegador no permite dibujar el espectrograma.');const pixels=ctx.createImageData(canvas.width,height);
 for(let m=0;m<analysis.frames;m++)for(let k=0;k<height;k++){
  const level=analysis.levels[m*analysis.bins+k],color=spPalette[Math.max(0,Math.min(255,Math.round((level+100)/100*255)))],offset=((height-1-k)*analysis.frames+m)*4;
  pixels.data[offset]=color[0];pixels.data[offset+1]=color[1];pixels.data[offset+2]=color[2];pixels.data[offset+3]=255;
 }
 ctx.putImageData(pixels,0,0);return {url:canvas.toDataURL(),height};
}
function drawSpTime(){
 if(!spSignal)return;const {samples,duration}=spSignal,x=t=>70+t/duration*720;let markup='';
 for(let i=0;i<=4;i++){const t=i*duration/4;markup+=`<line class="plot-grid-line" x1="${x(t)}" x2="${x(t)}" y1="25" y2="165"/><text class="plot-tick-label" x="${x(t)}" y="192" text-anchor="middle">${spFormat.format(t)}</text>`;}
 // Amplitud fija: −1 abajo, +1 arriba.
 const amp=v=>95-v*65;
 for(const v of [-1,0,1])markup+=`<line class="${v===0?'plot-axis-line':'plot-grid-line'}" x1="70" x2="790" y1="${amp(v)}" y2="${amp(v)}"/><text class="plot-tick-label" x="55" y="${amp(v)+4}" text-anchor="end">${v}</text>`;
 let envelope='';for(let i=0;i<720;i++){const first=Math.floor(i*samples.length/720),last=Math.max(first+1,Math.floor((i+1)*samples.length/720));let min=1,max=-1;for(let n=first;n<last;n++){min=Math.min(min,samples[n]);max=Math.max(max,samples[n]);}envelope+=`M${70+i},${amp(min).toFixed(2)} L${70+i},${amp(max).toFixed(2)} `;}
 markup+=`<path d="${envelope}" stroke="var(--wave)" stroke-width="1"/><g id="sp-time-selection"></g><line id="sp-time-cursor" x1="70" x2="70" y1="25" y2="165" stroke="#d97706" stroke-width="2"/><text class="plot-axis-label" x="790" y="222" text-anchor="end">Tiempo (s)</text><text class="plot-axis-label" x="12" y="15">Amplitud</text>`;
 document.querySelector('#sp-time').innerHTML=markup;updatePlaybackCursor();
}
function drawSpectrogram(){
 const fmax=Number(spFields.fmax.value),analysis=spAnalysis;if(!analysis||!spSignal)return;
 const image=spectrogramImage(analysis,fmax),duration=spSignal.duration,x=t=>70+t/duration*720,y=f=>340-f/fmax*290,dx=analysis.hop/spFs/duration*720,dy=(spFs/analysis.count)/fmax*290;
 let markup=`<defs><clipPath id="sp-image-clip"><rect x="70" y="50" width="720" height="290"/></clipPath><linearGradient id="sp-color-scale">${spPalette.filter((_,i)=>i%51===0).map((c,i)=>`<stop offset="${i*20}%" stop-color="rgb(${c.join(',')})"/>`).join('')}</linearGradient></defs><g clip-path="url(#sp-image-clip)"><image href="${image.url}" x="${70-dx/2}" y="${340-(image.height-.5)*dy}" width="${analysis.frames*dx}" height="${image.height*dy}" preserveAspectRatio="none" style="image-rendering:pixelated"/></g>`;
 for(let i=0;i<=4;i++){
  const t=i*duration/4,f=i*fmax/4;
  markup+=`<text class="plot-tick-label" x="${x(t)}" y="365" text-anchor="middle">${spFormat.format(t)}</text><text class="plot-tick-label" x="58" y="${y(f)+4}" text-anchor="end">${f}</text>`;
 }
 markup+='<text class="plot-axis-label" x="12" y="18">Frecuencia (Hz)</text><text class="plot-axis-label" x="790" y="390" text-anchor="end">Tiempo (s)</text><rect x="170" y="410" width="500" height="12" fill="url(#sp-color-scale)"/>';
 for(let i=0;i<=5;i++)markup+=`<text class="plot-tick-label" x="${170+i*100}" y="442" text-anchor="middle">${-100+i*20} dB</text>`;
 if(spSignal.kind==='dtmf')for(let i=0;i<spSignal.sequence.length;i++)markup+=`<text class="plot-annotation" x="${x(i*.35+.125)}" y="38" text-anchor="middle">${spSignal.sequence[i]}</text>`;
 markup+='<g id="sp-selection-overlay"></g><line id="sp-spectrum-cursor" x1="70" x2="70" y1="50" y2="340" stroke="white" stroke-width="2" stroke-dasharray="5 4"/>';
 document.querySelector('#sp-plot').innerHTML=markup;
 document.querySelector('#sp-plot').setAttribute('aria-label',`Espectrograma de ${spFields.signal.selectedOptions[0].textContent}, ${spFormat.format(duration)} segundos, 0 a ${fmax} Hz, amplitud de −100 a 0 dB`);
 updatePlaybackCursor();drawSelectedSpectrum();
}
function drawSelectedSpectrum(){
 if(!spAnalysis||!spSignal)return;
 const a=spAnalysis,last=Math.min(a.frames-1,Math.floor(spSignal.samples.length/a.hop)),frame=Math.max(0,Math.min(last,Math.round(spSelectedTime*spFs/a.hop))),center=frame*a.hop/spFs;
 spSelectedTime=center;
 const input=document.querySelector('#sp-inspect-time');input.max=last*a.hop/spFs;input.step=a.hop/spFs;input.value=center;input.setAttribute('aria-valuetext',`${spFormat.format(center)} segundos`);
 document.querySelector('#sp-slice-card').hidden=false;
 const start=center-a.count/(2*spFs),end=center+a.count/(2*spFs);
 document.querySelector('#sp-time-window-info').textContent=`Ventana seleccionada: ${a.count} muestras · ${spFormat.format(1000*a.count/spFs)} ms · centro ${spFormat.format(center)} s. Intervalo ${spFormat.format(start)} a ${spFormat.format(end)} s${start<0||end>spSignal.duration?' (la parte fuera del registro se completa con ceros)':''}.`;
 document.querySelector('#sp-slice-info').textContent=`Ventana ${frame+1} · centro ${spFormat.format(center)} s · intervalo ${spFormat.format(start)} a ${spFormat.format(end)} s · ${a.count} muestras. ${(start<0||end>spSignal.duration)?'Fuera del registro se completa con ceros.':''}`;
 const overlay=document.querySelector('#sp-selection-overlay'),xTime=t=>70+t/spSignal.duration*720;
 const temporal=document.querySelector('#sp-time-selection');
 if(temporal)temporal.innerHTML=`<rect x="${xTime(Math.max(0,start))}" y="25" width="${xTime(Math.min(spSignal.duration,end))-xTime(Math.max(0,start))}" height="140" fill="#e879f9" fill-opacity=".16" stroke="#e879f9" stroke-width="1.5"/><line x1="${xTime(center)}" x2="${xTime(center)}" y1="25" y2="165" stroke="#e879f9" stroke-width="2" stroke-dasharray="2 4"/>`;

 if(overlay)overlay.innerHTML=`<rect x="${xTime(Math.max(0,start))}" y="50" width="${xTime(Math.min(spSignal.duration,end))-xTime(Math.max(0,start))}" height="290" fill="#e879f9" fill-opacity=".12" stroke="#e879f9"/><line x1="${xTime(center)}" x2="${xTime(center)}" y1="50" y2="340" stroke="#e879f9" stroke-width="2" stroke-dasharray="2 4"/>`;
 const fmax=Number(spFields.fmax.value),x=f=>70+f/fmax*720,y=db=>245-(db+100)/100*205;let markup='';
 for(let i=0;i<=4;i++){const f=i*fmax/4;markup+=`<line class="plot-grid-line" x1="${x(f)}" x2="${x(f)}" y1="40" y2="245"/><text class="plot-tick-label" x="${x(f)}" y="270" text-anchor="middle">${f}</text>`;}
 for(let db=-100;db<=0;db+=20)markup+=`<line class="plot-grid-line" x1="70" x2="790" y1="${y(db)}" y2="${y(db)}"/><text class="plot-tick-label" x="58" y="${y(db)+4}" text-anchor="end">${db}</text>`;
 let path='';for(let k=0;k<=Math.floor(fmax*a.count/spFs);k++){const db=Math.min(0,Math.max(-100,a.levels[frame*a.bins+k]));path+=`${k?'L':'M'}${x(k*spFs/a.count).toFixed(2)},${y(db).toFixed(2)} `;}
 markup+=`<path d="${path}" fill="none" stroke="var(--wave)" stroke-width="2.5"/><text class="plot-axis-label" x="12" y="18">Amplitud (dB re 1)</text><text class="plot-axis-label" x="790" y="300" text-anchor="end">Frecuencia (Hz)</text>`;
 document.querySelector('#sp-slice-plot').innerHTML=markup;
}
document.querySelector('#sp-inspect-time').addEventListener('input',event=>{spSelectedTime=Number(event.target.value);drawSelectedSpectrum();});
document.querySelector('#sp-plot').addEventListener('click',event=>{
 if(!spAnalysis||!spSignal)return;
 const svg=event.currentTarget,matrix=svg.getScreenCTM();if(!matrix)return;
 const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const local=point.matrixTransform(matrix.inverse());
 if(local.x<70||local.x>790||local.y<50||local.y>395)return;
 spSelectedTime=(local.x-70)/720*spSignal.duration;drawSelectedSpectrum();
});
function updateSpReadouts(){
 const a=spAnalysis,actualOverlap=100*(1-a.hop/a.count),rows=[['Frecuencia de muestreo',`${spFs} Hz`],['Duración',`${spFormat.format(spSignal.duration)} s`],['Ventana',`${a.count} muestras · ${spFormat.format(1000*a.count/spFs)} ms`],['Separación entre bins',`${spFormat.format(spFs/a.count)} Hz`],['Salto entre ventanas',`${a.hop} muestras · ${spFormat.format(1000*a.hop/spFs)} ms`],['Solapamiento efectivo',`${spFormat.format(actualOverlap)} %`],['Ventanas analizadas',String(a.frames)]];
 document.querySelector('#sp-readouts').innerHTML=rows.map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
 document.querySelector('#sp-description').textContent=spExamples[spSignal.kind];
}
function scheduleSpectrogram(newSignal=false){
 clearTimeout(spTimer);const generation=++spGeneration,error=document.querySelector('#sp-error');
 try{
  if(newSignal){spSelectedTime=.125;stopPlayback(true);const sequence=spFields.dtmf.value.toUpperCase();spSignal=generateExample(spFields.signal.value,sequence);spAnalysis=null;drawSpTime();}
  if(![128,256,512,1024,2048,4096].includes(Number(spFields.count.value))||!['rect','hann','hamming','blackman','flattop'].includes(spFields.window.value)||!Number.isFinite(Number(spFields.overlap.value))||Number(spFields.overlap.value)<0||Number(spFields.overlap.value)>95)throw new Error('Selecciona una ventana válida y un solapamiento entre 0 y 95 %.');
  error.hidden=true;spFields.dtmf.setAttribute('aria-invalid','false');spPlay.disabled=false;
 }catch(e){error.textContent=e.message;error.hidden=false;spPlay.disabled=true;if(newSignal){spSignal=null;spAnalysis=null;document.querySelector('#sp-slice-card').hidden=true;document.querySelector('#sp-time').replaceChildren();document.querySelector('#sp-plot').replaceChildren();document.querySelector('#sp-readouts').replaceChildren();}
  spFields.dtmf.setAttribute('aria-invalid',spFields.signal.value==='dtmf'?'true':'false');document.querySelector('#sp-analysis-status').textContent='Corrige los controles para analizar la señal.';return;}
 document.querySelector('#sp-overlap-value').textContent=`${spFields.overlap.value} %`;spFields.overlap.setAttribute('aria-valuetext',`${spFields.overlap.value} por ciento`);
 document.querySelector('#sp-analysis-status').textContent='Calculando espectrograma…';
 spTimer=setTimeout(()=>{
  if(generation!==spGeneration)return;
  try{spAnalysis=analyzeSpectrogram(spSignal.samples,Number(spFields.count.value),spFields.window.value,Number(spFields.overlap.value));drawSpectrogram();updateSpReadouts();document.querySelector('#sp-analysis-status').textContent=`${spAnalysis.frames} ventanas · ${spFields.window.selectedOptions[0].textContent} · N = ${spAnalysis.count}`;}catch(e){error.textContent=e.message;error.hidden=false;document.querySelector('#sp-analysis-status').textContent='No se pudo completar el análisis.';}
 },40);
}
function playbackPosition(){return spSource?Math.min(spSignal.duration,spOffset+spAudio.currentTime-spStarted):spOffset;}
function updatePlaybackCursor(){
 if(!spSignal)return;const position=playbackPosition(),x=70+position/spSignal.duration*720;
 for(const id of ['sp-time-cursor','sp-spectrum-cursor']){const cursor=document.getElementById(id);if(cursor){cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);}}
 document.querySelector('#sp-playback-time').textContent=`${spFormat.format(position)} / ${spFormat.format(spSignal.duration)} s`;
}
function stopPlayback(reset){
 ++spAudioToken;if(spSource){spOffset=playbackPosition();const source=spSource;spSource=null;source.onended=null;source.stop();source.disconnect();}
 if(reset)spOffset=0;spPlay.textContent=spOffset>0?'▶ Reanudar':'▶ Play';spPlay.setAttribute('aria-pressed','false');spStop.disabled=spOffset===0;spPlay.disabled=false;
 document.querySelector('#sp-audio-status').textContent=reset?'Pulsa Play para escuchar.':'Reproducción en pausa.';updatePlaybackCursor();
}
async function togglePlayback(){
 if(spSource){stopPlayback(false);return;}if(!spSignal||spPlay.disabled)return;
 const token=++spAudioToken;spPlay.disabled=true;
 try{
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)throw new Error('Este navegador no admite reproducción Web Audio.');
  if(!spAudio){spAudio=new AudioContextClass();spGain=spAudio.createGain();spGain.connect(spAudio.destination);}
  await spAudio.resume();if(token!==spAudioToken)return;
  if(spOffset>=spSignal.duration)spOffset=0;
  const buffer=spAudio.createBuffer(1,spSignal.samples.length,spFs);buffer.copyToChannel(spSignal.samples,0);
  const source=spAudio.createBufferSource();source.buffer=buffer;source.connect(spGain);spGain.gain.setValueAtTime(Number(spFields.volume.value)/100,spAudio.currentTime);
  spSource=source;spStarted=spAudio.currentTime;
  source.onended=()=>{if(spSource!==source)return;spSource=null;source.disconnect();spOffset=spSignal.duration;spPlay.textContent='▶ Repetir';spPlay.setAttribute('aria-pressed','false');spStop.disabled=false;document.querySelector('#sp-audio-status').textContent='Reproducción terminada.';updatePlaybackCursor();};
  source.start(0,spOffset);spPlay.textContent='❚❚ Pausar';spPlay.setAttribute('aria-pressed','true');spStop.disabled=false;document.querySelector('#sp-audio-status').textContent='Reproduciendo la señal analizada.';
 }catch(e){document.querySelector('#sp-audio-status').textContent=`No se pudo reproducir: ${e.message}`;}finally{if(token===spAudioToken)spPlay.disabled=false;}
}
spPlay.addEventListener('click',togglePlayback);spStop.addEventListener('click',()=>stopPlayback(true));
spFields.signal.addEventListener('change',()=>{const dtmf=spFields.signal.value==='dtmf';document.querySelector('#sp-dtmf-control').hidden=!dtmf;document.querySelector('#sp-dtmf-help').hidden=!dtmf;scheduleSpectrogram(true);});
spFields.dtmf.addEventListener('input',()=>scheduleSpectrogram(true));
for(const name of ['count','window'])spFields[name].addEventListener('change',()=>scheduleSpectrogram());spFields.overlap.addEventListener('input',()=>scheduleSpectrogram());
spFields.fmax.addEventListener('change',()=>{if(![2000,4000].includes(Number(spFields.fmax.value)))return;drawSpectrogram();});
spFields.volume.addEventListener('input',()=>{document.querySelector('#sp-volume-value').textContent=`${spFields.volume.value} %`;spFields.volume.setAttribute('aria-valuetext',`${spFields.volume.value} por ciento`);if(spGain)spGain.gain.setTargetAtTime(Number(spFields.volume.value)/100,spAudio.currentTime,.015);});
function spAnimate(){if(spSource&&!document.hidden)updatePlaybackCursor();requestAnimationFrame(spAnimate);}
window.addEventListener('pagehide',()=>stopPlayback(true));scheduleSpectrogram(true);requestAnimationFrame(spAnimate);
