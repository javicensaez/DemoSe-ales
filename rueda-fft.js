const sampleRate = 256;
const motor = { resistance: 3.9, inductance: 12e-6, k: 0.072e-3 * 60 / (2 * Math.PI), rotorInertia: 1e-9, damping: 0, gear: 1000 };
const fields = Object.fromEntries(['mass','voltage','eccentricity','start','inertia','radius','encoder-amplitude','encoder-offset-x','encoder-offset-y','encoder-error','impedance'].map(name => [name,document.querySelector(`#wheel-${name}`)]));
const windowSelect=document.querySelector('#wheel-window'), weightingSelect=document.querySelector('#wheel-weighting');
const spectrumRangeSelect=document.querySelector('#wheel-spectrum-range'), spectrumScaleSelect=document.querySelector('#wheel-spectrum-scale');
const connectionSelect=document.querySelector('#wheel-connection'), delayInput=document.querySelector('#wheel-delay');
const liveInput=document.querySelector('#wheel-live');
let liveRemainder=0, lastPaint=0;
const invertPolarityInput=document.querySelector('#wheel-invert-polarity');
const numberFormat=new Intl.NumberFormat('es',{maximumFractionDigits:3});
const formatNumber=value=>numberFormat.format(Math.abs(value)<1e-10?0:value);
let paused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastTimestamp=null, animationTime=0, capture, captureNumber=0;

function rotorModel(mass,voltage,eccentricityMm,inertia=1,radius=.1){
 const eccentricity=eccentricityMm/1000,kOutput=motor.k*motor.gear,steadyOmega=voltage/kOutput;
 return {mass,voltage,eccentricityMm,eccentricity,inertia,radius,kOutput,steadyOmega,steadyRpm:steadyOmega*60/(2*Math.PI),frequency:steadyOmega/(2*Math.PI)};
}
function loadInertia(model,angle){
 return model.inertia+model.mass*(model.radius**2+model.eccentricity**2+2*model.radius*model.eccentricity*Math.cos(angle));
}
function inertiaDerivative(model,angle){
 return -2*model.mass*model.radius*model.eccentricity*Math.sin(angle);
}
// Unbalanced Load integra el momento angular: par = d(I·ω)/dt.
// Integra exactamente corriente y momento con la inercia evaluada en el ángulo medio.
// Evita la inestabilidad de un método explícito: L/R es de solo 3 microsegundos.
function motorStep(model,state,dt){
 if(dt===0)return {...state};
 const inertia=loadInertia(model,state.angle+state.omega*dt/2)+motor.gear**2*motor.rotorInertia;
 const a=motor.resistance/motor.inductance,d=model.kOutput/motor.inductance,c=model.kOutput/inertia,b=motor.gear**2*motor.damping/inertia;
 const determinant=a*b+d*c;
 const fast=(-(a+b)-Math.sqrt(Math.max(0,(a-b)**2-4*d*c)))/2,slow=determinant/fast;
 const equilibriumOmega=model.voltage*model.kOutput/(motor.resistance*motor.gear**2*motor.damping+model.kOutput**2);
 const equilibriumCurrent=motor.gear**2*motor.damping*equilibriumOmega/model.kOutput;
 const startInertia=loadInertia(model,state.angle)+motor.gear**2*motor.rotorInertia;
 const effectiveStartOmega=state.omega*startInertia/inertia;
 const di=state.current-equilibriumCurrent,dw=effectiveStartOmega-equilibriumOmega;
 const ef=Math.exp(fast*dt),es=Math.exp(slow*dt),g0=(slow*ef-fast*es)/(slow-fast),g1=(es-ef)/(slow-fast);
 let current=equilibriumCurrent+g0*di+g1*(-a*di-d*dw);
 const effectiveEndOmega=equilibriumOmega+g0*dw+g1*(c*di-b*dw);
 const angle=state.angle+(effectiveStartOmega+effectiveEndOmega)*dt/2;
 const endInertia=loadInertia(model,angle)+motor.gear**2*motor.rotorInertia;
 // Corrige la corriente de final de paso por la variación geométrica de ω.
 // Respuesta del circuito RL a esa rampa; se anula cuando la inercia es constante.
 const midOmega=(effectiveStartOmega+effectiveEndOmega)/2;
 const geometricAcceleration=-inertiaDerivative(model,(state.angle+angle)/2)*midOmega**2/inertia;
 current-=model.kOutput/motor.resistance*geometricAcceleration*(dt/2*(1+ef)-(1-ef)/a);
 return {angle,omega:effectiveEndOmega*inertia/endInertia,current};
}
function simulateMotor(model,start,count,substeps=8){
 const first=Math.round(start*sampleRate),states=[];
 let state={angle:0,omega:0,current:0};
 for(let n=0;n<=first+count;n++){
  if(n>=Math.max(0,first-1))states.push({...state});
  if(n<first+count)for(let j=0;j<substeps;j++)state=motorStep(model,state,1/(sampleRate*substeps));
 }
 const offset=first>0?1:0;
 return {samples:states.slice(offset,offset+count),end:states[offset+count],previous:first>0?states[0]:null};
}
function encoderSignals(angle,calibration={amplitude:2.5,offsetX:0,offsetY:0,error:0}){
 return {cos:calibration.offsetX+calibration.amplitude*Math.cos(angle),sin:calibration.offsetY+calibration.amplitude*Math.sin(angle+calibration.error*Math.PI/180)};
}
function readParameters(){
 const values={};let valid=true;
 for(const [name,input] of Object.entries(fields)){
  const raw=input.value.trim(),value=Number(raw),ok=raw!==''&&Number.isFinite(value)&&value>=Number(input.min)&&value<=Number(input.max);
  input.setAttribute('aria-invalid',String(!ok));valid=valid&&ok;values[name]=value;
 }
 if(!valid||![64,128,256,512,1024,2048,4096].includes(Number(windowSelect.value))||!['rect','hann'].includes(weightingSelect.value))return null;
 return {model:rotorModel(values.mass,(invertPolarityInput.checked?-1:1)*values.voltage,values.eccentricity,values.inertia,values.radius),start:values.start,impedance:values.impedance,calibration:{amplitude:values['encoder-amplitude'],offsetX:values['encoder-offset-x'],offsetY:values['encoder-offset-y'],error:values['encoder-error']}};
}
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

function amplitudeSpectrum(samples, weighting) {
  const count = samples.length;
  const weights = Array.from({ length: count }, (_, n) => weighting === "hann" ? 0.5 - 0.5 * Math.cos(2 * Math.PI * n / count) : 1);
  const sumWeights = weights.reduce((sum, value) => sum + value, 0);
  const transformed = fft(samples.map((value, n) => value * weights[n]));
  return Array.from({ length: count / 2 + 1 }, (_, k) => ({
    frequency: k * sampleRate / count,
    amplitude: Math.hypot(transformed.real[k], transformed.imag[k]) * (k === 0 || k === count / 2 ? 1 : 2) / sumWeights,
  }));
}

function niceTicks(min, max, count = 6) {
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  const ticks = [];
  for (let i = Math.ceil(min / step); i * step <= max + step * 1e-9; i += 1) ticks.push(i * step);
  return ticks;
}

function chartMarkup({ curves, xMax, xMin = 0, yRange, xLabel, yLabel, frequencyMarker = null, stems = false }) {
  const left = 70, right = 775, top = 50, bottom = 249;
  const x = value => left + (value - xMin) / (xMax - xMin) * (right - left);
  const y = value => top + (yRange[1] - value) / (yRange[1] - yRange[0]) * (bottom - top);
  const parts = [];
  for (const tick of niceTicks(xMin, xMax)) {
    parts.push(`<line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${x(tick)}" y1="${top}" x2="${x(tick)}" y2="${bottom}" /><text class="plot-tick-label" x="${x(tick)}" y="271" text-anchor="middle">${formatNumber(tick)}</text>`);
  }
  for (const tick of niceTicks(yRange[0], yRange[1])) {
    parts.push(`<line class="${tick === 0 ? "plot-axis-line" : "plot-grid-line"}" x1="${left}" y1="${y(tick)}" x2="${right}" y2="${y(tick)}" /><text class="plot-tick-label" x="${left - 10}" y="${y(tick) + 4}" text-anchor="end">${formatNumber(tick)}</text>`);
  }
  for (const [index, curve] of curves.entries()) {
    const points = curve.points.filter(point => point.x >= xMin && point.x <= xMax);
    const path = points.map((point, i) => `${i ? "L" : "M"}${x(point.x).toFixed(2)},${y(point.y).toFixed(2)}`).join(" ");
    if (stems && index === 0) for (const point of points) {
      if (point.y > yRange[1] * 1e-8) parts.push(`<line x1="${x(point.x)}" y1="${y(0)}" x2="${x(point.x)}" y2="${y(point.y)}" stroke="${curve.color}" stroke-width="1.5" />`);
    }
    parts.push(`<path d="${path}" fill="none" stroke="${curve.color}" stroke-width="2.5" ${curve.dashed ? 'stroke-dasharray="7 5"' : ""} vector-effect="non-scaling-stroke" />`);
  }
  if (frequencyMarker !== null) {
    for (let order = 1; order <= 6; order += 1) {
      const frequency = order * frequencyMarker;
      if (frequency < xMin || frequency > xMax) continue;
      const position = x(frequency);
      parts.push(`<line x1="${position}" y1="${top}" x2="${position}" y2="${bottom}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 5" /><text class="plot-annotation" x="${position + 4}" y="40">${order}×</text>`);
    }
  }
  parts.push(`<text class="plot-axis-label" x="${right}" y="297" text-anchor="end">${xLabel}</text><text class="plot-axis-label" x="12" y="16">${yLabel}</text>`);
  return parts.join("");
}


function complexSpectrum(real,imaginary,weighting){
 const count=real.length,weights=Array.from({length:count},(_,n)=>weighting==='hann'?.5-.5*Math.cos(2*Math.PI*n/count):1),gain=weights.reduce((s,v)=>s+v,0);
 const result=fft(real.map((v,n)=>v*weights[n]),imaginary.map((v,n)=>v*weights[n]));
 return Array.from({length:count},(_,k)=>({frequency:(k<count/2?k:k-count)*sampleRate/count,amplitude:Math.hypot(result.real[k],result.imag[k])/gain})).sort((a,b)=>a.frequency-b.frequency);
}
function makeCapture(model,count,weighting,start,calibration,connection='yx',delayed=true){
 return captureFromMotion(model,count,weighting,start,calibration,connection,delayed,simulateMotor(model,start,count));
}
function captureFromMotion(model,count,weighting,start,calibration,connection,delayed,motion){
 const readings=motion.samples.map(s=>encoderSignals(s.angle,calibration));
 const cos=readings.map(s=>s.cos),sin=readings.map(s=>s.sin),previous=motion.previous?encoderSignals(motion.previous.angle,calibration):{cos:0,sin:0};
 const delayedCos=delayed?[previous.cos,...cos.slice(0,-1)]:cos,delayedSin=delayed?[previous.sin,...sin.slice(0,-1)]:sin;
 const real=connection==='yx'?delayedSin:delayedCos,imaginary=connection==='yx'?delayedCos:delayedSin,duration=count/sampleRate;
 const meanFrequency=(motion.end.angle-motion.samples[0].angle)/(2*Math.PI*duration);
 return {model,count,weighting,start,duration,motion,calibration,connection,delayed,cos,sin,real,imaginary,meanFrequency,cosSpectrum:amplitudeSpectrum(cos,weighting),sinSpectrum:amplitudeSpectrum(sin,weighting),complex:complexSpectrum(real,imaginary,weighting)};
}
function peakOf(spectrum){return spectrum.reduce((peak,bin)=>bin.amplitude>peak.amplitude?bin:peak,spectrum[0]);}
function renderSpectrum(){
 if(!capture)return;
 const limit=Number(spectrumRangeSelect.value),logarithmic=spectrumScaleSelect.value==='db',power=spectrumScaleSelect.value==='dbm';
 const amplitude=v=>power?10*Math.log10(Math.max(1e-19,v*v/capture.impedance)/.001):logarithmic?20*Math.log10(Math.max(1e-9,v)):v;
 const max=Math.max(1,...capture.cosSpectrum.map(b=>b.amplitude),...capture.sinSpectrum.map(b=>b.amplitude),...capture.complex.map(b=>b.amplitude));
 const yRange=power?[-160,Math.max(60,Math.ceil(amplitude(max)/20)*20)]:logarithmic?[-180,Math.max(20,Math.ceil(Math.log10(max))*20)]:[0,1.2*max],yLabel=power?'Potencia (dBm)':logarithmic?'Amplitud (dB re 1 V)':'Amplitud (V)';
 // En señales reales el valor unilateral es amplitud de pico: P = A²/(2R).
 // En la señal compleja bilateral cada bin aporta P = |Z|²/R.
 const realAmplitude=(bin,i)=>power?amplitude(bin.amplitude/((i===0||i===capture.count/2)?1:Math.sqrt(2))):amplitude(bin.amplitude);
 const points=s=>s.map(b=>({x:b.frequency,y:amplitude(b.amplitude)}));
 document.querySelector('#wheel-spectrum-plot').innerHTML=chartMarkup({curves:[{points:capture.cosSpectrum.map((b,i)=>({x:b.frequency,y:realAmplitude(b,i)})),color:'var(--answer)'},{points:capture.sinSpectrum.map((b,i)=>({x:b.frequency,y:realAmplitude(b,i)})),color:'#d97706',dashed:true}],xMax:limit,yRange,xLabel:'Frecuencia (Hz)',yLabel,frequencyMarker:capture.meanFrequency!==0?Math.abs(capture.meanFrequency):null});
 document.querySelector('#wheel-complex-plot').innerHTML=chartMarkup({curves:[{points:points(capture.complex),color:'var(--wave)'}],xMin:-limit,xMax:limit,yRange,xLabel:'Frecuencia con signo (Hz)',yLabel,frequencyMarker:capture.meanFrequency!==0?(capture.connection==='yx'?-1:1)*capture.meanFrequency:null});
 document.querySelector('#wheel-spectrum-plot').setAttribute('aria-label',`FFT unilateral de los canales del encoder, rango 0 a ${limit} Hz`);
 document.querySelector('#wheel-complex-plot').setAttribute('aria-label',`FFT compleja bilateral, rango menos ${limit} a ${limit} Hz, conexión ${capture.connection==='yx'?'real seno, imaginaria coseno':'real coseno, imaginaria seno'}`);
}
function updateWheelDrawing(){
 if(!capture)return;
 const position=animationTime*sampleRate,n=Math.min(capture.count-1,Math.floor(position)),fraction=position-n,from=capture.motion.samples[n],to=capture.motion.samples[n+1]??capture.motion.end;
 const angle=liveInput.checked?capture.motion.end.angle:from.angle+(to.angle-from.angle)*fraction;
 const offset=capture.model.eccentricityMm*.9;
 const gx=240+offset*Math.cos(angle),gy=170+offset*Math.sin(angle);
 document.querySelector('#wheel-rotor').setAttribute('transform',`rotate(${angle*180/Math.PI} 240 170)`);
 document.querySelector('#wheel-gravity').setAttribute('r',6+3*Math.sqrt(capture.model.mass));
 for(const [id,attrs] of [['wheel-gravity',{cx:gx,cy:gy}],['wheel-eccentricity-line',{x2:gx,y2:gy}],['wheel-gravity-label',{x:gx+14,y:gy-8}]])for(const [name,value]of Object.entries(attrs))document.querySelector(`#${id}`).setAttribute(name,value);
 document.querySelector('#wheel-gravity-label').textContent=offset===0?'G = O':'G · masa';
 const signals=encoderSignals(angle,capture.calibration);
 document.querySelector('#wheel-live-cos').textContent=`${formatNumber(signals.cos)} V`;document.querySelector('#wheel-live-sin').textContent=`${formatNumber(signals.sin)} V`;
 document.querySelector('#wheel-animation-time').textContent=`Instante mostrado: ${formatNumber(capture.start+(liveInput.checked?capture.duration:animationTime))} s desde el arranque`;
}
function renderCapture(){
 const params=readParameters(),error=document.querySelector('#wheel-error');error.hidden=params!==null;
 if(!params){error.textContent='Completa todos los parámetros con valores dentro de sus rangos.';return;}
 const {model,start,calibration,impedance}=params;
 for(const [name,value,unit]of [['mass',model.mass,'kg'],['voltage',model.voltage,'V'],['eccentricity',model.eccentricityMm,'mm'],['start',start,'s']]){const label=`${formatNumber(value)} ${unit}`;document.querySelector(`#wheel-${name}-value`).textContent=label;fields[name].setAttribute('aria-valuetext',label);}
 capture=makeCapture(model,Number(windowSelect.value),weightingSelect.value,start,calibration,connectionSelect.value,delayInput.checked);capture.impedance=impedance;animationTime=0;liveRemainder=0;captureNumber++;
 paintCapture();
}
function paintCapture(){
 const {model,start}=capture;
 document.querySelector('#wheel-capture-status').textContent=`${liveInput.checked?(paused?'Simulación pausada':'Simulación en vivo'):`Captura ${captureNumber}`} · ${formatNumber(start)}–${formatNumber(start+capture.duration)} s`;
 const magnitude=Math.max(1,...capture.cos.map(Math.abs),...capture.sin.map(Math.abs))*1.2;
 document.querySelector('#wheel-time-plot').innerHTML=chartMarkup({curves:[{points:capture.cos.map((v,n)=>({x:n/sampleRate,y:v})),color:'var(--answer)'},{points:capture.sin.map((v,n)=>({x:n/sampleRate,y:v})),color:'#d97706',dashed:true}],xMax:capture.duration,yRange:[-magnitude,magnitude],xLabel:'Tiempo dentro de la ventana (s)',yLabel:'Encoder (V)'});
 const speeds=capture.motion.samples.map(s=>s.omega*60/(2*Math.PI));
 document.querySelector('#wheel-speed-plot').innerHTML=chartMarkup({curves:[{points:speeds.map((v,n)=>({x:n/sampleRate,y:v})),color:'var(--wave)'}],xMax:capture.duration,yRange:[Math.min(0,model.steadyRpm*1.1,...speeds),Math.max(1,model.steadyRpm*1.1,...speeds)],xLabel:'Tiempo dentro de la ventana (s)',yLabel:'Velocidad de la rueda (RPM)'});
 document.querySelector('#wheel-time-plot').setAttribute('aria-label',`Canales del encoder entre ${start} y ${start+capture.duration} segundos desde el arranque`);
 document.querySelector('#wheel-speed-plot').setAttribute('aria-label',`Velocidad calculada entre ${formatNumber(Math.min(...speeds))} y ${formatNumber(Math.max(...speeds))} RPM`);
 const meanI=model.inertia+model.mass*(model.radius**2+model.eccentricity**2)+motor.gear**2*motor.rotorInertia;
 const rows=[['RPM límite sin carga',`${formatNumber(model.steadyRpm)} RPM`],['RPM medias en la ventana',`${formatNumber(capture.meanFrequency*60)} RPM`],['RPM mín. / máx. en la ventana',`${formatNumber(Math.min(...speeds))} / ${formatNumber(Math.max(...speeds))}`],['Inercia de carga mín. / máx.',`${formatNumber(model.inertia+model.mass*(model.radius-model.eccentricity)**2)} / ${formatNumber(model.inertia+model.mass*(model.radius+model.eccentricity)**2)} kg·m²`],['Constante mecánica aproximada',`${formatNumber(meanI*motor.resistance/model.kOutput**2)} s`],['Resolución de la FFT',`${formatNumber(sampleRate/capture.count)} Hz`],['Pico FFT compleja',`${formatNumber(peakOf(capture.complex).frequency)} Hz · ${formatNumber(peakOf(capture.complex).amplitude)} V`]];
 document.querySelector('#wheel-readouts').innerHTML=rows.map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
 document.querySelector('#wheel-result-note').textContent=model.voltage===0?'Sin alimentación y partiendo del reposo, el encoder conserva los niveles correspondientes al ángulo inicial. El desplazamiento cero no anula el encoder.':model.eccentricity===0?'Con rA = 0 la inercia es constante. En régimen estable el encoder conserva la fundamental; los lóbulos de una ventana no coherente son fuga espectral.':'La variación de inercia modifica la velocidad a lo largo de cada vuelta y genera armónicos del encoder. El par incluye I·dω/dt y (dI/dθ)·ω², como el código fuente de Unbalanced Load. Analiza una ventana tardía para reducir la influencia del arranque.';
 document.querySelector('#wheel-harmonics').innerHTML=Array.from({length:6},(_,i)=>{const order=i+1,f=order*Math.abs(capture.meanFrequency);if(f>sampleRate/2)return `<tr><th scope="row">${order}×</th><td>${formatNumber(f)} Hz</td><td colspan="2">Fuera de Nyquist</td></tr>`;const k=Math.round(f*capture.count/sampleRate);return `<tr><th scope="row">${order}×</th><td>${formatNumber(f)} Hz</td><td>${formatNumber(capture.cosSpectrum[k].amplitude)} V</td><td>${formatNumber(capture.sinSpectrum[k].amplitude)} V</td></tr>`;}).join('');
 renderSpectrum();updateWheelDrawing();
}
function advanceLive(seconds){
 liveRemainder+=seconds*sampleRate;
 const steps=Math.floor(liveRemainder);liveRemainder-=steps;
 for(let n=0;n<steps;n++){
  capture.motion.previous=capture.motion.samples.shift();
  capture.motion.samples.push(capture.motion.end);
  let state=capture.motion.end;
  for(let j=0;j<8;j++)state=motorStep(capture.model,state,1/(sampleRate*8));
  capture.motion.end=state;capture.start+=1/sampleRate;
 }
 return steps;
}
function refreshLive(){
 const old=capture;
 capture=captureFromMotion(old.model,old.count,old.weighting,old.start,old.calibration,old.connection,old.delayed,old.motion);capture.impedance=old.impedance;
 paintCapture();
}
function updatePauseButton(){const b=document.querySelector('#wheel-pause');b.setAttribute('aria-pressed',String(paused));b.textContent=paused?'Reanudar simulación':'Pausar simulación';}
function animationFrame(timestamp){
 if(lastTimestamp!==null&&!paused&&capture&&!document.hidden){
  const elapsed=Math.min(.1,(timestamp-lastTimestamp)/1000);
  if(liveInput.checked){
   advanceLive(elapsed);
   if(timestamp-lastPaint>=200){refreshLive();lastPaint=timestamp;}
  }else animationTime=(animationTime+elapsed/4)%capture.duration;
 }
 lastTimestamp=timestamp;if(!paused)updateWheelDrawing();requestAnimationFrame(animationFrame);
}
liveInput.addEventListener('change',()=>{liveRemainder=0;animationTime=0;lastTimestamp=null;paintCapture();});
Object.values(fields).forEach(input=>input.addEventListener('input',renderCapture));
for(const select of [windowSelect,weightingSelect,connectionSelect])select.addEventListener('change',renderCapture);
delayInput.addEventListener('change',renderCapture);spectrumRangeSelect.addEventListener('change',renderSpectrum);spectrumScaleSelect.addEventListener('change',renderSpectrum);
invertPolarityInput.addEventListener('change',renderCapture);
document.querySelector('#wheel-capture').addEventListener('click',renderCapture);document.querySelector('#wheel-pause').addEventListener('click',()=>{paused=!paused;lastTimestamp=null;updatePauseButton();if(capture)refreshLive();});
function loadSlideExample(displacementMm){
 fields.voltage.value=10;fields.mass.value=1;fields.eccentricity.value=displacementMm;fields.inertia.value=1;fields.radius.value=.1;fields.start.value=60;invertPolarityInput.checked=false;
 windowSelect.value=4096;weightingSelect.value='hann';spectrumRangeSelect.value=25;spectrumScaleSelect.value='dbm';connectionSelect.value='xy';delayInput.checked=true;renderCapture();
}
document.querySelector('#wheel-slide-example').addEventListener('click',()=>loadSlideExample(100));
document.querySelector('#wheel-slide-small-example').addEventListener('click',()=>loadSlideExample(10));
updatePauseButton();renderCapture();requestAnimationFrame(animationFrame);
