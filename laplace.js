'use strict';
const lpSelect=document.querySelector('#lp-signal'),lpFields=Object.fromEntries(['alpha','beta','omega','duration','order','sigma'].map(name=>[name,document.querySelector(`#lp-${name}`)]));
const lpFormat=new Intl.NumberFormat('es',{maximumFractionDigits:3});
const step=t=>t>0?1:t<0?0:.5;
const rect=v=>Math.abs(v)<.5?1:Math.abs(v)===.5?.5:0;
function laplaceModel(kind,p){
 const {alpha:a,beta:b,omega:w,duration:T,order:n}=p;
 const right=(bound=0)=>({type:'right',bound}),left=(bound=0)=>({type:'left',bound}),all={type:'all'},empty={type:'empty'};
 const pole=(re=0,im=0,multiplicity=1)=>({re,im,multiplicity});
 let m={params:[],poles:[],note:'',roc:right(),rocTex:String.raw`\Re(s)>0`};
 switch(kind){
  case 'delta':Object.assign(m,{timeTex:String.raw`\delta(t)`,transform:'1',roc:all,distribution:'delta',note:'El impulso tiene peso 1 y no altura finita.'});break;
  case 'deltaDelay':Object.assign(m,{params:['duration'],timeTex:String.raw`\delta(t-T)`,transform:String.raw`e^{-sT}`,roc:all,distribution:'delta',impulseTime:T,note:'El retraso multiplica la transformada por una exponencial y no introduce polos.'});break;
  case 'deltaDerivative':Object.assign(m,{params:['order'],timeTex:String.raw`\delta^{(n)}(t)`,transform:'s^n',roc:all,distribution:n===0?'delta':'derivative',note:'La derivada del impulso es una distribución; no se dibuja como una función de altura finita.'});break;
  case 'step':Object.assign(m,{time:t=>step(t),timeTex:'u(t)',transform:String.raw`\frac1s`,poles:[pole()]});break;
  case 'ramp':Object.assign(m,{time:t=>t*step(t),timeTex:'tu(t)',transform:String.raw`\frac1{s^2}`,poles:[pole(0,0,2)]});break;
  case 'power':Object.assign(m,{params:['order'],time:t=>t**n*step(t),timeTex:'t^n u(t)',transform:String.raw`\frac{n!}{s^{n+1}}`,poles:[pole(0,0,n+1)]});break;
  case 'exp':Object.assign(m,{params:['alpha'],time:t=>Math.exp(a*t)*step(t),timeTex:String.raw`e^{\alpha t}u(t)`,transform:String.raw`\frac1{s-\alpha}`,roc:right(a),rocTex:String.raw`\Re(s)>\alpha`,poles:[pole(a)]});break;
  case 'expDelay':Object.assign(m,{params:['alpha','duration'],time:t=>Math.exp(a*(t-T))*step(t-T),timeTex:String.raw`e^{\alpha(t-T)}u(t-T)`,transform:String.raw`\frac{e^{-sT}}{s-\alpha}`,roc:right(a),rocTex:String.raw`\Re(s)>\alpha`,poles:[pole(a)],note:'El retraso desplaza la señal y añade el factor e^(−sT), conservando la ROC.'});break;
  case 'expPower':Object.assign(m,{params:['alpha','order'],time:t=>t**n*Math.exp(a*t)*step(t),timeTex:String.raw`t^n e^{\alpha t}u(t)`,transform:String.raw`\frac{n!}{(s-\alpha)^{n+1}}`,roc:right(a),rocTex:String.raw`\Re(s)>\alpha`,poles:[pole(a,0,n+1)]});break;
  case 'sin':case 'cos':case 'dampedSin':case 'dampedCos':{
   const damped=kind.startsWith('damped'),sine=['sin','dampedSin'].includes(kind),shift=damped?a:0;
   Object.assign(m,{params:damped?['alpha','omega']:['omega'],time:t=>Math.exp(shift*t)*(sine?Math.sin(w*t):Math.cos(w*t))*step(t),timeTex:(damped?String.raw`e^{\alpha t}`:'')+(sine?String.raw`\sin(\Omega t)u(t)`:String.raw`\cos(\Omega t)u(t)`),transform:sine?(damped?String.raw`\frac{\Omega}{(s-\alpha)^2+\Omega^2}`:String.raw`\frac{\Omega}{s^2+\Omega^2}`):(damped?String.raw`\frac{s-\alpha}{(s-\alpha)^2+\Omega^2}`:String.raw`\frac{s}{s^2+\Omega^2}`),roc:right(shift),rocTex:damped?String.raw`\Re(s)>\alpha`:String.raw`\Re(s)>0`,poles:[pole(shift,w),pole(shift,-w)]});break;
  }
  case 'complex':Object.assign(m,{params:['alpha','omega'],time:t=>Math.exp(a*t)*Math.cos(w*t)*step(t),imag:t=>Math.exp(a*t)*Math.sin(w*t)*step(t),timeTex:String.raw`e^{(\alpha+j\Omega)t}u(t)`,transform:String.raw`\frac1{s-\alpha-j\Omega}`,roc:right(a),rocTex:String.raw`\Re(s)>\alpha`,poles:[pole(a,w)]});break;
  case 'leftStep':Object.assign(m,{time:t=>-step(-t),timeTex:'-u(-t)',transform:String.raw`\frac1s`,roc:left(),rocTex:String.raw`\Re(s)<0`,poles:[pole()],note:'Misma expresión 1/s que el escalón causal, pero distinta ROC y distinta señal.'});break;
  case 'leftExp':Object.assign(m,{params:['alpha'],time:t=>-Math.exp(a*t)*step(-t),timeTex:String.raw`-e^{\alpha t}u(-t)`,transform:String.raw`\frac1{s-\alpha}`,roc:left(a),rocTex:String.raw`\Re(s)<\alpha`,poles:[pole(a)],note:'Comparte la expresión con la exponencial causal, pero converge a la izquierda del polo.'});break;
  case 'bilateral':Object.assign(m,{params:['beta'],time:t=>Math.exp(-b*Math.abs(t)),timeTex:String.raw`e^{-\beta|t|}`,transform:String.raw`\frac{2\beta}{\beta^2-s^2}`,roc:{type:'strip',min:-b,max:b},rocTex:String.raw`-\beta<\Re(s)<\beta`,poles:[pole(-b),pole(b)]});break;
  case 'gauss':Object.assign(m,{params:['beta'],time:t=>Math.exp(-b*t*t),timeTex:String.raw`e^{-\beta t^2}`,transform:String.raw`\sqrt{\frac{\pi}{\beta}}e^{s^2/(4\beta)}`,roc:all,note:'El decaimiento cuadrático domina cualquier ponderación exponencial e^(−σt).'});break;
  case 'pulse':case 'centerPulse':{
   const centered=kind==='centerPulse';Object.assign(m,{params:['duration'],time:t=>rect((t-(centered?0:T/2))/T),timeTex:centered?String.raw`\operatorname{rect}(t/T)`:'u(t)-u(t-T)',transform:centered?String.raw`\frac{2\sinh(sT/2)}s`:String.raw`\frac{1-e^{-sT}}s`,roc:all,note:`En s = 0 se toma el límite: X(0) = T = ${lpFormat.format(T)}. No hay polo en el origen.`});break;
  }
  case 'triangle':case 'causalTriangle':{
   const causal=kind==='causalTriangle';Object.assign(m,{params:['duration'],time:t=>Math.max(0,1-Math.abs((t-(causal?T:0))/T)),timeTex:causal?String.raw`\operatorname{tri}((t-T)/T)`:String.raw`\operatorname{tri}(t/T)`,transform:causal?String.raw`\frac{(1-e^{-sT})^2}{Ts^2}`:String.raw`\frac{2(\cosh(sT)-1)}{Ts^2}`,roc:all,note:`Singularidad removible en s = 0: X(0) = T = ${lpFormat.format(T)}. La altura del triángulo es 1 y su base mide 2T.`});break;
  }
  case 'constant':case 'wholeExp':case 'wholeSin':case 'wholeCos':{
   const exponential=kind==='wholeExp',sine=kind==='wholeSin',cosine=kind==='wholeCos';
   Object.assign(m,{params:exponential?['alpha']:(sine||cosine)?['omega']:[],time:t=>exponential?Math.exp(a*t):sine?Math.sin(w*t):cosine?Math.cos(w*t):1,timeTex:exponential?String.raw`e^{\alpha t}`:sine?String.raw`\sin(\Omega t)`:cosine?String.raw`\cos(\Omega t)`:'1',transform:String.raw`\text{No existe transformada bilateral ordinaria}`,roc:empty,note:'La convergencia de las colas positiva y negativa exige condiciones incompatibles para σ. La ROC es vacía.'});break;
  }
  default:throw new Error('Selecciona una señal válida.');
 }
 if(m.roc.type==='all')m.rocTex=String.raw`\mathrm{ROC}=\mathbb C`;
 if(m.roc.type==='empty')m.rocTex=String.raw`\mathrm{ROC}=\varnothing`;
 return m;
}
function inRoc(roc,sigma){switch(roc.type){case 'all':return true;case 'right':return sigma>roc.bound+1e-9;case 'left':return sigma<roc.bound-1e-9;case 'strip':return sigma>roc.min+1e-9&&sigma<roc.max-1e-9;default:return false;}}
function lpParameters(){let valid=true;const p={};for(const [name,input]of Object.entries(lpFields)){const value=Number(input.value),ok=input.value.trim()!==''&&Number.isFinite(value)&&value>=Number(input.min||0)&&value<=Number(input.max||(name==='order'?4:Infinity));input.setAttribute('aria-invalid',String(!ok));valid=valid&&ok;p[name]=value;}return valid&&Number.isInteger(p.order)?p:null;}
function lpTicks(min,max){const raw=(max-min)/5,pow=10**Math.floor(Math.log10(raw)),r=raw/pow,step=(r<=1?1:r<=2?2:r<=5?5:10)*pow,values=[];for(let v=Math.ceil(min/step)*step;v<=max+step*1e-9;v+=step)values.push(Math.abs(v)<1e-9?0:v);return values;}
function drawLaplaceTime(model){
 const times=Array.from({length:1601},(_,n)=>-4+n/200),values=model.time?times.map(t=>({t,re:model.time(t),im:model.imag?.(t)??0})):[],all=values.flatMap(v=>[v.re,v.im]);
 const min=Math.min(-.25,...all),max=Math.max(1.25,...all),pad=(max-min)*.08,low=min-pad,high=max+pad,x=t=>70+(t+4)/8*700,y=v=>250-(v-low)/(high-low)*210;let markup='';
 for(let t=-4;t<=4;t++)markup+=`<line class="${t===0?'plot-axis-line':'plot-grid-line'}" x1="${x(t)}" x2="${x(t)}" y1="40" y2="250"/><text class="plot-tick-label" x="${x(t)}" y="274" text-anchor="middle">${t}</text>`;
 for(const v of lpTicks(low,high))markup+=`<line class="plot-grid-line" x1="70" x2="770" y1="${y(v)}" y2="${y(v)}"/><text class="plot-tick-label" x="60" y="${y(v)+4}" text-anchor="end">${lpFormat.format(v)}</text>`;
 markup+=`<line class="plot-axis-line" x1="70" x2="770" y1="${y(0)}" y2="${y(0)}"/>`;
 for(const [part,color,dashed]of [['re','var(--wave)',false],...(model.imag?[['im','#d97706',true]]:[])])if(values.length){const path=values.map((v,n)=>`${n?'L':'M'}${x(v.t).toFixed(2)},${y(v[part]).toFixed(2)}`).join(' ');markup+=`<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" ${dashed?'stroke-dasharray="7 4"':''}/>`;}
 if(model.distribution==='delta'){const at=x(model.impulseTime??0),tip=y(1);markup+=`<line x1="${at}" x2="${at}" y1="${y(0)}" y2="${tip}" stroke="var(--wave)" stroke-width="3"/><path d="M${at-6},${tip+10} L${at},${tip} L${at+6},${tip+10}" fill="none" stroke="var(--wave)" stroke-width="2"/><text class="plot-annotation" x="${at+12}" y="${tip}">peso 1</text>`;}
 if(model.distribution==='derivative')markup+='<text class="plot-annotation" x="420" y="90" text-anchor="middle">Distribución δ⁽ⁿ⁾(t): no tiene gráfica ordinaria</text>';
 markup+='<text class="plot-axis-label" x="12" y="18">Amplitud (u.a.)</text><text class="plot-axis-label" x="770" y="301" text-anchor="end">Tiempo (s)</text>';
 document.querySelector('#lp-time-plot').innerHTML=markup;document.querySelector('#lp-time-note').textContent=model.imag?'Parte real: azul continuo · Parte imaginaria: naranja discontinuo.':model.distribution?'Los impulsos representan distribuciones; la flecha indica un peso, no una altura finita.':'La ventana visible es de −4 a 4 s. La ROC se calcula para toda la señal, no para el fragmento mostrado.';
}
function drawLaplaceRoc(model,p){
 const x=v=>75+(v+6)/12*690,y=v=>395-(v+8)/16*350,roc=model.roc;let markup='';
 const shade=(a,b)=>`<rect x="${x(a)}" y="45" width="${x(b)-x(a)}" height="350" fill="var(--wave)" opacity=".16"/>`;
 if(roc.type==='all')markup+=shade(-6,6);if(roc.type==='right')markup+=shade(roc.bound,6);if(roc.type==='left')markup+=shade(-6,roc.bound);if(roc.type==='strip')markup+=shade(roc.min,roc.max);
 for(let sigma=-6;sigma<=6;sigma+=2)markup+=`<line class="${sigma===0?'plot-axis-line':'plot-grid-line'}" x1="${x(sigma)}" x2="${x(sigma)}" y1="45" y2="395"/><text class="plot-tick-label" x="${x(sigma)}" y="421" text-anchor="middle">${sigma}</text>`;
 for(let omega=-8;omega<=8;omega+=2)markup+=`<line class="${omega===0?'plot-axis-line':'plot-grid-line'}" x1="75" x2="765" y1="${y(omega)}" y2="${y(omega)}"/><text class="plot-tick-label" x="63" y="${y(omega)+4}" text-anchor="end">${omega}</text>`;
 const boundaries=['right','left'].includes(roc.type)?[roc.bound]:roc.type==='strip'?[roc.min,roc.max]:[];
 for(const boundary of boundaries)markup+=`<line x1="${x(boundary)}" x2="${x(boundary)}" y1="45" y2="395" stroke="var(--foreground)" stroke-width="2" stroke-dasharray="7 5"/><text class="plot-annotation" x="${x(boundary)}" y="32" text-anchor="middle">σ = ${lpFormat.format(boundary)}</text>`;
 for(const pole of model.poles){const px=x(pole.re),py=y(pole.im);markup+=`<path d="M${px-6},${py-6} L${px+6},${py+6} M${px-6},${py+6} L${px+6},${py-6}" stroke="var(--foreground)" stroke-width="3"/>`;if(pole.multiplicity>1)markup+=`<text class="plot-annotation" x="${px+12}" y="${py-12}">orden ${pole.multiplicity}</text>`;}
 markup+=`<line x1="${x(p.sigma)}" x2="${x(p.sigma)}" y1="45" y2="395" stroke="#d97706" stroke-width="2.5" stroke-dasharray="3 4"/><text class="plot-axis-label" x="765" y="455" text-anchor="end">σ = Re(s) (s⁻¹)</text><text class="plot-axis-label" x="12" y="18">ω = Im(s) (rad/s)</text>`;
 if(roc.type==='empty')markup+='<text class="plot-annotation" x="420" y="80" text-anchor="middle">ROC vacía: no hay zona de convergencia</text>';
 if(roc.type==='all')markup+='<text class="plot-annotation" x="420" y="80" text-anchor="middle">ROC: todo el plano complejo</text>';
 document.querySelector('#lp-roc-plot').innerHTML=markup;
 document.querySelector('#lp-status').textContent=`Recta naranja σ = ${lpFormat.format(p.sigma)}: ${inRoc(roc,p.sigma)?'pertenece a la ROC.':'queda fuera de la ROC (sus fronteras están excluidas).'} ${model.poles.length?'Las cruces son polos.':'No se representan polos.'}`;
 document.querySelector('#lp-fourier').textContent=inRoc(roc,0)?'El eje imaginario pertenece a la ROC: X(jω) proporciona la transformada de Fourier, con la interpretación distribucional correspondiente para impulsos.':'El eje imaginario no pertenece a la ROC. No se deduce una transformada de Fourier ordinaria evaluando la integral allí; puede existir una interpretación como distribución.';
}
let lpMathVersion=0,lpMathQueue=Promise.resolve();
function updateLaplaceFormulas(model,p){
 const version=++lpMathVersion;
 lpMathQueue=lpMathQueue.catch(()=>{}).then(async()=>{
  if(window.MathJax?.startup?.promise)await window.MathJax.startup.promise;if(version!==lpMathVersion)return;
  const host=document.querySelector('#lp-expressions');window.MathJax?.typesetClear?.([host]);
  for(const [id,formula]of [['lp-time-formula',`x(t)=${model.timeTex}`],['lp-transform-formula',model.roc.type==='empty'?model.transform:`X(s)=${model.transform}`],['lp-roc-formula',model.rocTex]])document.getElementById(id).textContent=`\\[${formula}\\]`;
  if(window.MathJax?.typesetPromise)await window.MathJax.typesetPromise([host]);
 });
}
function renderLaplace(){
 const p=lpParameters(),error=document.querySelector('#lp-error');error.hidden=!!p;if(!p){error.textContent='Revisa los valores de los parámetros dentro de sus rangos.';return;}
 let model;try{model=laplaceModel(lpSelect.value,p);}catch(e){error.textContent=e.message;error.hidden=false;return;}
 for(const name of ['alpha','beta','omega','duration','order']){const visible=model.params.includes(name);document.getElementById(`lp-${name}-control`).hidden=!visible;lpFields[name].disabled=!visible;}
 for(const name of ['alpha','beta','omega','duration','sigma']){const label=lpFormat.format(p[name]);document.getElementById(`lp-${name}-value`).textContent=label;lpFields[name].setAttribute('aria-valuetext',label);}
 document.querySelector('#lp-note').textContent=model.note;drawLaplaceTime(model);drawLaplaceRoc(model,p);updateLaplaceFormulas(model,p);
}
lpSelect.addEventListener('change',renderLaplace);Object.values(lpFields).forEach(input=>input.addEventListener(input.tagName==='SELECT'?'change':'input',renderLaplace));renderLaplace();
