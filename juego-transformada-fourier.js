'use strict';
const ftgSinc=x=>Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);
const z=(re,im=0)=>({re,im});
const add=(a,b)=>z(a.re+b.re,a.im+b.im),neg=a=>z(-a.re,-a.im);
const mul=(a,b)=>z(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
function div(a,b){const d=b.re*b.re+b.im*b.im;if(d===0)throw new Error('División por cero.');return z((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);}
const cexp=a=>z(Math.exp(a.re)*Math.cos(a.im),Math.exp(a.re)*Math.sin(a.im));
const csin=a=>z(Math.sin(a.re)*Math.cosh(a.im),Math.cos(a.re)*Math.sinh(a.im));
const ccos=a=>z(Math.cos(a.re)*Math.cosh(a.im),-Math.sin(a.re)*Math.sinh(a.im));
function power(a,b){
 if(Math.abs(b.im)>1e-12||!Number.isInteger(b.re)||Math.abs(b.re)>8)throw new Error('Usa exponentes enteros entre −8 y 8.');
 let result=z(1);for(let n=0;n<Math.abs(b.re);n++)result=mul(result,a);
 return b.re<0?div(z(1),result):result;
}
class FourierExpression {
 constructor(source){
  if(!source.trim())throw new Error('Escribe una expresión antes de chequear.');
  if(source.length>500)throw new Error('La expresión admite hasta 500 caracteres.');
  this.tokens=[];this.pos=0;
  const pattern=/\s*(?:(\d+(?:\.\d*)?|\.\d+)([eE][+-]?\d+)?|([a-zA-Z]+)|([+\-*/^()]))/y;
  let offset=0;while(offset<source.length){if(!source.slice(offset).trim())break;pattern.lastIndex=offset;const m=pattern.exec(source);if(!m)throw new Error(`Símbolo no admitido en la posición ${offset+1}. Usa * para multiplicar.`);offset=pattern.lastIndex;this.tokens.push(m[1]?{type:'number',value:Number(m[1]+(m[2]??''))}:m[3]?{type:'name',value:m[3].toLowerCase()}:{type:m[4]});}
  if(this.tokens.length>200)throw new Error('Simplifica la expresión: admite hasta 200 elementos.');
  this.tokens.push({type:'end'});this.depth=0;this.root=this.sum();
  if(this.peek()!=='end')throw new Error('Revisa los paréntesis y escribe * entre los factores.');
 }
 peek(){return this.tokens[this.pos].type;}
 take(type){if(this.peek()!==type)throw new Error(`Falta «${type}» en la expresión.`);return this.tokens[this.pos++];}
 sum(){let a=this.product();while(['+','-'].includes(this.peek())){const op=this.tokens[this.pos++].type,b=this.product(),left=a;a=f=>op==='+'?add(left(f),b(f)):add(left(f),neg(b(f)));}return a;}
 product(){let a=this.unary();while(['*','/'].includes(this.peek())){const op=this.tokens[this.pos++].type,b=this.unary(),left=a;a=f=>op==='*'?mul(left(f),b(f)):div(left(f),b(f));}return a;}
 unary(){if(++this.depth>60)throw new Error('Demasiados niveles de paréntesis o signos.');let result;if(this.peek()==='+'){this.pos++;result=this.unary();}else if(this.peek()==='-'){this.pos++;const a=this.unary();result=f=>neg(a(f));}else result=this.exponent();this.depth--;return result;}
 exponent(){const a=this.atom();if(this.peek()!=='^')return a;this.pos++;const b=this.unary();return f=>power(a(f),b(f));}
 atom(){
  if(this.peek()==='number'){const v=this.take('number').value;return ()=>z(v);}
  if(this.peek()==='('){this.pos++;const a=this.sum();this.take(')');return a;}
  if(this.peek()!=='name')throw new Error('Esperaba un número, f, j o una función.');
  const name=this.take('name').value;
  if(name==='f')return f=>z(f);if(name==='pi')return ()=>z(Math.PI);if(['j','i'].includes(name))return ()=>z(0,1);
  const functions={exp:cexp,sin:csin,cos:ccos,sinc:a=>Math.hypot(a.re,a.im)<1e-10?z(1):div(csin(mul(z(Math.PI),a)),mul(z(Math.PI),a)),rect:a=>{if(Math.abs(a.im)>1e-10)throw new Error('rect necesita un argumento real.');return z(Math.abs(a.re)<.5?1:Math.abs(a.re)===.5?.5:0);}};
  if(!Object.hasOwn(functions,name))throw new Error(`«${name}» no está permitido. Usa sinc, exp, sin, cos o rect.`);
  this.take('(');const a=this.sum();this.take(')');return f=>functions[name](a(f));
 }
 value(f){const a=this.root(f);if(!Number.isFinite(a.re)||!Number.isFinite(a.im)||Math.hypot(a.re,a.im)>1e6)throw new Error('La expresión produce valores no finitos o mayores que 10⁶. Revisa denominadores y exponentes.');return a;}
 sample(f){
  try{return this.value(f);}catch(error){
   // Admite ceros removibles, como sin(pi*f)/(pi*f), sin ocultar polos.
   try{const a=this.value(f-1e-6),b=this.value(f+1e-6);if(Math.hypot(a.re-b.re,a.im-b.im)<1e-4*Math.max(1,Math.hypot(a.re,a.im),Math.hypot(b.re,b.im)))return mul(z(.5),add(a,b));}catch{}
   throw error;
  }
 }
}
const pulse=(t,left,right)=>t>left&&t<right?1:t===left||t===right?.5:0;
const challenges=[
 {description:'Altura 1, entre t = −1 s y t = 1 s; cero fuera.',target:t=>pulse(t,-1,1),spectrum:f=>z(2*ftgSinc(2*f)),answer:'2*sinc(2*f)',latex:String.raw`\[X(f)=2\operatorname{sinc}(2f)\]`},
 {description:'Altura 1, entre t = 0 s y t = 2 s; cero fuera.',target:t=>pulse(t,0,2),spectrum:f=>mul(z(2*ftgSinc(2*f)),cexp(z(0,-2*Math.PI*f))),answer:'2*sinc(2*f)*exp(-j*2*pi*f)',latex:String.raw`\[X(f)=2\operatorname{sinc}(2f)e^{-j2\pi f}\]`},
 {description:'Pulso de altura +1 entre −1 y 0 s y pulso de altura −1 entre 0 y 1 s; cero fuera.',target:t=>pulse(t,-1,0)-pulse(t,0,1),spectrum:f=>z(0,2*ftgSinc(f)*Math.sin(Math.PI*f)),answer:'sinc(f)*(exp(j*pi*f)-exp(-j*pi*f))',latex:String.raw`\[X(f)=\operatorname{sinc}(f)\left(e^{j\pi f}-e^{-j\pi f}\right)=2j\operatorname{sinc}(f)\sin(\pi f)\]`},
 {description:'Triángulo centrado en t = 0, de altura 3 y anchura total 4 s: base entre −2 y 2 s; cero fuera.',target:t=>3*Math.max(0,1-Math.abs(t)/2),spectrum:f=>z(6*ftgSinc(2*f)**2),answer:'6*sinc(2*f)^2',latex:String.raw`\[x(t)=3\operatorname{tri}(t/2)\quad\Longleftrightarrow\quad X(f)=6\operatorname{sinc}^2(2f)\]`},
 {description:'Pulso de altura 1 entre −2 y 2 s, más un triángulo de base entre −1 y 1 s y altura 1. La altura total en t = 0 es 2; cero fuera de [−2, 2].',target:t=>pulse(t,-2,2)+Math.max(0,1-Math.abs(t)),spectrum:f=>z(4*ftgSinc(4*f)+ftgSinc(f)**2),answer:'4*sinc(4*f)+sinc(f)^2',latex:String.raw`\[x(t)=\operatorname{rect}(t/4)+\operatorname{tri}(t)\quad\Longleftrightarrow\quad X(f)=4\operatorname{sinc}(4f)+\operatorname{sinc}^2(f)\]`},
 {description:'Altura 1 entre 0 y 1 s y entre 3 y 4 s; baja linealmente hasta 0 en t = 2 s y vuelve a subir hasta 1 en t = 3 s. Cero fuera de [0, 4].',range:[-1,5],target:t=>pulse(t,0,4)-Math.max(0,1-Math.abs(t-2)),spectrum:f=>mul(z(4*ftgSinc(4*f)-ftgSinc(f)**2),cexp(z(0,-4*Math.PI*f))),answer:'(4*sinc(4*f)-sinc(f)^2)*exp(-j*4*pi*f)',latex:String.raw`\[x(t)=\operatorname{rect}\!\left(\frac{t-2}{4}\right)-\operatorname{tri}(t-2)\]\[X(f)=\left[4\operatorname{sinc}(4f)-\operatorname{sinc}^2(f)\right]e^{-j4\pi f}\]`},
 {description:'Rampa de 0 a 1 entre 0 y 1 s; salto de +1 en t = 1 s; pico de altura 3 en t = 2 s; descenso hasta 2 en t = 3 s, salto a 1 y rampa hasta 0 en t = 4 s. Cero fuera de [0, 4].',range:[-1,5],target:t=>2*Math.max(0,1-Math.abs(t-2)/2)+pulse(t,1,3),spectrum:f=>mul(z(4*ftgSinc(2*f)**2+2*ftgSinc(2*f)),cexp(z(0,-4*Math.PI*f))),answer:'(4*sinc(2*f)^2+2*sinc(2*f))*exp(-j*4*pi*f)',latex:String.raw`\[x(t)=2\operatorname{tri}\!\left(\frac{t-2}{2}\right)+\operatorname{rect}\!\left(\frac{t-2}{2}\right)\]\[X(f)=\left[4\operatorname{sinc}^2(2f)+2\operatorname{sinc}(2f)\right]e^{-j4\pi f}\]`},
 {description:'Altura 1 entre −1 y 0 s, altura 2 entre 0 y 1 s y altura 1 entre 1 y 2 s; cero fuera de [−1, 2].',target:t=>pulse(t,-1,2)+pulse(t,0,1),spectrum:f=>mul(z(3*ftgSinc(3*f)+ftgSinc(f)),cexp(z(0,-Math.PI*f))),answer:'(3*sinc(3*f)+sinc(f))*exp(-j*pi*f)',latex:String.raw`\[x(t)=\operatorname{rect}\!\left(\frac{t-1/2}{3}\right)+\operatorname{rect}(t-1/2)\]\[X(f)=\left[3\operatorname{sinc}(3f)+\operatorname{sinc}(f)\right]e^{-j\pi f}\]`}
];
const ftgCount=4096,ftgRate=128,ftgDf=ftgRate/ftgCount;
function inverseSpectrum(spectrum,range=[-4,4]){
 const real=Float64Array.from(spectrum,s=>s.re),imag=Float64Array.from(spectrum,s=>s.im),count=spectrum.length;
 for(let i=1,j=0;i<count;i++){let bit=count>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[real[i],real[j]]=[real[j],real[i]];[imag[i],imag[j]]=[imag[j],imag[i]];}}
 for(let size=2;size<=count;size*=2)for(let start=0;start<count;start+=size)for(let j=0;j<size/2;j++){
  const phase=2*Math.PI*j/size,c=Math.cos(phase),s=Math.sin(phase),even=start+j,odd=even+size/2,re=real[odd]*c-imag[odd]*s,im=real[odd]*s+imag[odd]*c;
  real[odd]=real[even]-re;imag[odd]=imag[even]-im;real[even]+=re;imag[even]+=im;
 }
 const first=Math.round(range[0]*ftgRate),last=Math.round(range[1]*ftgRate);
 return Array.from({length:last-first+1},(_,i)=>{const n=first+i,k=(n+count)%count;return {t:n/ftgRate,re:real[k]*ftgDf,im:imag[k]*ftgDf};});
}
function evaluateAnswer(source,index){
 const expression=new FourierExpression(source),spectrum=Array.from({length:ftgCount},(_,k)=>expression.sample((k<ftgCount/2?k:k-ftgCount)*ftgDf));
 let error=0,energy=0;
 for(let k=0;k<ftgCount;k++){const target=challenges[index].spectrum((k<ftgCount/2?k:k-ftgCount)*ftgDf);error+=(spectrum[k].re-target.re)**2+(spectrum[k].im-target.im)**2;energy+=target.re**2+target.im**2;}
 return {score:Math.max(0,100*(1-Math.sqrt(error/energy))),points:inverseSpectrum(spectrum,challenges[index].range)};
}
const challengeSelect=document.querySelector('#ftg-challenge'),expressionInput=document.querySelector('#ftg-expression'),feedback=document.querySelector('#ftg-feedback'),errorBox=document.querySelector('#ftg-error');
const attempts=challenges.map(()=>({expression:'',result:null,revealed:false}));let challengeIndex=0;
const fmt=new Intl.NumberFormat('es',{maximumFractionDigits:2});
function draw(){
 const target=challenges[challengeIndex].target,result=attempts[challengeIndex].result,points=result?.points??[];
 const [tmin,tmax]=challenges[challengeIndex].range??[-4,4];
 const goal=Array.from({length:1601},(_,n)=>{const t=tmin+(tmax-tmin)*n/1600;return {t,value:target(t)};});
 const amplitudes=[...goal.map(p=>p.value),...points.flatMap(p=>[p.re,p.im])];
 const max=Math.ceil(Math.max(1.5,...amplitudes)*1.1),min=Math.floor(Math.min(-.5,...amplitudes)*1.1);
 const x=t=>65+(t-tmin)/(tmax-tmin)*705,y=v=>255-(v-min)/(max-min)*215;let markup='';
 for(let t=Math.ceil(tmin);t<=tmax;t++)markup+=`<line class="${t===0?'plot-axis-line':'plot-grid-line'}" x1="${x(t)}" x2="${x(t)}" y1="40" y2="255"/><text class="plot-tick-label" x="${x(t)}" y="280" text-anchor="middle">${t}</text>`;
 for(let v=min;v<=max;v++){markup+=`<line class="plot-grid-line" x1="65" x2="770" y1="${y(v)}" y2="${y(v)}"/><text class="plot-tick-label" x="55" y="${y(v)+4}" text-anchor="end">${fmt.format(v)}</text>`;}
 markup+=`<line class="plot-axis-line" x1="65" x2="770" y1="${y(0)}" y2="${y(0)}"/>`;
 const path=data=>data.map((p,i)=>`${i?'L':'M'}${x(p.t).toFixed(2)},${y(p.value).toFixed(2)}`).join(' ');
 markup+=`<path d="${path(goal)}" fill="none" stroke="var(--wave)" stroke-width="3"/>`;
 if(result){markup+=`<path d="${path(points.map(p=>({t:p.t,value:p.re})))}" fill="none" stroke="#d97706" stroke-width="2.5" stroke-dasharray="7 4"/>`;if(points.some(p=>Math.abs(p.im)>.01))markup+=`<path d="${path(points.map(p=>({t:p.t,value:p.im})))}" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="2 5"/><text class="plot-annotation" x="75" y="26">Imaginaria: violeta punteado</text>`;}
 markup+='<text class="plot-axis-label" x="770" y="316" text-anchor="end">Tiempo (s)</text><text class="plot-axis-label" x="12" y="18">Amplitud (u.a.)</text>';
 document.querySelector('#ftg-plot').innerHTML=markup;
}
let solutionQueue=Promise.resolve();
function updateSolution(){
 const host=document.querySelector('#ftg-answer'),state=attempts[challengeIndex],latex=challenges[challengeIndex].latex;
 host.hidden=!state.revealed;document.querySelector('#ftg-solution').textContent=state.revealed?'Ocultar solución':'Mostrar solución';
 solutionQueue=solutionQueue.catch(()=>{}).then(async()=>{if(window.MathJax?.startup?.promise)await window.MathJax.startup.promise;window.MathJax?.typesetClear?.([host]);host.textContent=latex;if(window.MathJax?.typesetPromise)await window.MathJax.typesetPromise([host]);});
}
function updatePassButton(){
 document.querySelector('#ftg-pass-next').hidden=!(attempts[challengeIndex].result?.score>99.5&&challengeIndex<challenges.length-1);
}
function resultMessage(result){if(!result)return 'Escribe tu respuesta para comparar las señales.';return `Coincidencia espectral: ${fmt.format(result.score)} %. ${result.score>99.5?'Transformada correcta.':'Compara la anchura, el desplazamiento, la altura y los signos.'}${result.points.some(p=>Math.abs(p.im)>.01)?' La reconstrucción tiene parte imaginaria: tu expresión no corresponde a una señal totalmente real.':''}`;}
function showChallenge(index){challengeIndex=index;challengeSelect.value=String(index);expressionInput.value=attempts[index].expression;errorBox.hidden=true;expressionInput.removeAttribute('aria-invalid');feedback.textContent=resultMessage(attempts[index].result);document.querySelector('#ftg-description').textContent=challenges[index].description;document.querySelector('#ftg-prev').disabled=index===0;document.querySelector('#ftg-next').disabled=index===challenges.length-1;updateSolution();updatePassButton();draw();}
document.querySelector('#ftg-form').addEventListener('submit',event=>{
 event.preventDefault();const state=attempts[challengeIndex];state.expression=expressionInput.value;
 try{state.result=evaluateAnswer(state.expression,challengeIndex);errorBox.hidden=true;expressionInput.setAttribute('aria-invalid','false');feedback.textContent=resultMessage(state.result);}catch(error){state.result=null;errorBox.textContent=error.message;errorBox.hidden=false;expressionInput.setAttribute('aria-invalid','true');feedback.textContent='Corrige la expresión y vuelve a chequear.';}updatePassButton();draw();
});
expressionInput.addEventListener('input',()=>{const state=attempts[challengeIndex];state.expression=expressionInput.value;state.result=null;errorBox.hidden=true;expressionInput.removeAttribute('aria-invalid');feedback.textContent='Respuesta modificada: pulsa Chequear para actualizar la reconstrucción.';updatePassButton();draw();});
challengeSelect.addEventListener('change',()=>showChallenge(Number(challengeSelect.value)));
document.querySelector('#ftg-pass-next').addEventListener('click',()=>{showChallenge(Math.min(challenges.length-1,challengeIndex+1));expressionInput.focus();});
document.querySelector('#ftg-prev').addEventListener('click',()=>showChallenge(Math.max(0,challengeIndex-1)));
document.querySelector('#ftg-next').addEventListener('click',()=>showChallenge(Math.min(challenges.length-1,challengeIndex+1)));
document.querySelector('#ftg-solution').addEventListener('click',()=>{attempts[challengeIndex].revealed=!attempts[challengeIndex].revealed;updateSolution();});
showChallenge(0);
