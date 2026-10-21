'use strict';
const firstBlockSteps=[
 {title:'Diagrama original',rule:'Paso 0 · Identificar las señales y los signos',description:'El lazo interno rodea 1/(s − 2), con retorno s + 1 y signo negativo. El retorno exterior es unitario y también negativo. La rama de ganancia 5 toma R antes del primer sumador.',equations:[String.raw`G_1=\frac1{s+2},\quad G_2=\frac1{s-2},\quad H=s+1`,String.raw`E=R-Y,\quad V=G_1E,\quad W=V+5R-HY,\quad Y=G_2W`],caution:'La rama superior transporta 5R, no 5E. Ese punto de toma debe conservarse.',aria:'Original: R menos Y pasa por G1; su salida y 5R entran positivamente al segundo sumador; el retorno H por Y entra negativamente. Después está G2 y la salida Y.'},
 {title:'Cerrar la realimentación interna',rule:'Paso 1 · Realimentación negativa',description:'Sustituimos el lazo formado por 1/(s − 2) y s + 1 por F = G₂/(1 + G₂H). El segundo sumador conserva las dos entradas externas positivas: V y 5R.',equations:[String.raw`Y=G_2\bigl(V+5R-HY\bigr)\quad\Rightarrow\quad Y=\frac{G_2}{1+G_2H}(V+5R)`,String.raw`F=\frac{\frac1{s-2}}{1+\frac{s+1}{s-2}}=\frac1{(s-2)+(s+1)}=\frac1{2s-1}`],caution:'Solo desaparece el retorno interno. El retorno exterior Y → primer sumador sigue activo.',aria:'Se elimina el lazo interno. El bloque final es F igual a 1 sobre 2s menos 1. El retorno exterior y la rama 5R se mantienen.'},
 {title:'Mover el primer sumador después de G₁',rule:'Paso 2 · Desplazamiento de un sumador con compensación',description:'La entrada R pasa primero por G₁. Para que la salida del sumador siga siendo G₁(R − Y), la rama negativa debe pasar también por G₁. Aparece una copia de 1/(s + 2) en el retorno.',equations:[String.raw`V=G_1(R-Y)=G_1R-G_1Y`,String.raw`\text{Antes: }R-Y\;\longrightarrow\;G_1\qquad\text{Después: }G_1R-G_1Y`],caution:'Mover el sumador conservando un retorno unitario cambiaría el sistema. La copia de G₁ en la rama de retorno es obligatoria.',aria:'R pasa por G1 antes del primer sumador. La realimentación negativa de Y pasa por una copia de G1. El sumador siguiente sigue añadiendo 5R.'},
 {title:'Combinar los sumadores consecutivos',rule:'Paso 3 · Asociación de sumas',description:'Entre los dos sumadores no hay bloques ni tomas intermedias. Se combinan en un solo sumador, conservando los dos signos positivos y el signo negativo.',equations:[String.raw`U=(G_1R-G_1Y)+5R=G_1R+5R-G_1Y`,String.raw`Y=F\bigl(G_1R+5R-G_1Y\bigr)`],caution:'Las ramas positivas parten de R; la negativa procede de Y a través de G₁.',aria:'Un único sumador recibe G1 por R y 5R positivamente, y G1 por Y negativamente; su salida pasa por F.'},
 {title:'Reducir las dos ramas en paralelo',rule:'Paso 4 · Paralelo: sumar funciones de transferencia',description:'Las ramas G₁ y 5 comparten la entrada R y llegan positivamente al mismo sumador. Se reemplazan por P = G₁ + 5. Este bloque queda antes del lazo de realimentación restante.',equations:[String.raw`P=G_1+5=\frac1{s+2}+5=\frac{5s+11}{s+2}`,String.raw`Y=F\bigl(PR-G_1Y\bigr)`],caution:'P está fuera del lazo. El avance del lazo restante es F y su retorno es G₁; P no entra en el producto de realimentación.',aria:'R pasa por P igual a 5s más 11 sobre s más 2, luego al sumador con retorno negativo G1 por Y, y después al bloque F.'},
 {title:'Cerrar la realimentación restante',rule:'Paso 5 · Realimentación negativa',description:'El lazo restante tiene avance F = 1/(2s − 1) y retorno G₁ = 1/(s + 2). Se sustituye por C = F/(1 + FG₁). El bloque P permanece en serie por delante.',equations:[String.raw`C=\frac{F}{1+FG_1}=\frac{\frac1{2s-1}}{1+\frac1{(2s-1)(s+2)}}`,String.raw`C=\frac{s+2}{(2s-1)(s+2)+1}=\frac{s+2}{2s^2+3s-1}`],caution:'El denominador usa 1 + FG₁ porque la realimentación es negativa.',aria:'Quedan dos bloques en serie: P igual a 5s más 11 sobre s más 2 y C igual a s más 2 sobre 2s cuadrado más 3s menos 1.'},
 {title:'Multiplicar los bloques en serie',rule:'Paso 6 · Serie y simplificación algebraica',description:'Sin ramas intermedias, P y C se multiplican. El factor s + 2 aparece en numerador y denominador y se cancela en la expresión racional equivalente.',equations:[String.raw`G(s)=PC=\frac{5s+11}{s+2}\,\frac{s+2}{2s^2+3s-1}`,String.raw`\boxed{G(s)=\frac{5s+11}{2s^2+3s-1}}`],caution:'La comprobación directa que aparece debajo reproduce las ecuaciones del diagrama original y llega al mismo resultado.',aria:'Un único bloque equivalente, 5s más 11 dividido entre 2s cuadrado más 3s menos 1, conecta R con Y.'}
];
function blockDrawingTools(prefix){
 const marker=`${prefix}-arrow`;
 const wire=(d,active=false)=>`<path d="${d}" class="blocks-wire${active?' blocks-changed-wire':''}" marker-end="url(#${marker})"/>`;
 const node=(x,y)=>`<circle cx="${x}" cy="${y}" r="5" class="blocks-take"/>`;
 const text=(x,y,value,cls='blocks-label',anchor='middle')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${value}</text>`;
 function box(x,y,w,h,numerator,denominator='',active=false){
  const cx=x+w/2,cy=y+h/2,lineHalf=Math.min(w/2-14,Math.max(numerator.length,denominator.length)*7.5+10);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="blocks-box${active?' blocks-changed':''}"/>`+(denominator?text(cx,cy-10,numerator)+`<line x1="${cx-lineHalf}" x2="${cx+lineHalf}" y1="${cy}" y2="${cy}" class="blocks-fraction"/>`+text(cx,cy+28,denominator):text(cx,cy+8,numerator));
 }
 const sum=(x,y,active=false)=>`<circle cx="${x}" cy="${y}" r="28" class="blocks-sum${active?' blocks-changed':''}"/>`+text(x,y+9,'Σ');
 const signs=(x,y,top=false,bottom=true)=>text(x-43,y-15,'+')+(top?text(x+20,y-43,'+'):'')+(bottom?text(x+22,y+49,'−'):'');
 let content=`<defs><marker id="${marker}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,4.5 L0,9 Z" fill="var(--foreground)"/></marker></defs>`;
 return {wire,node,text,box,sum,signs,defs:content};
}
function firstBlockDiagram(stage,prefix){
 const {wire,node,text,box,sum,signs,defs}=blockDrawingTools(prefix);let content=defs;
 if(stage<=1){
  content+=wire('M35 260 H172')+wire('M228 260 H320')+wire('M450 260 H532')+wire('M588 260 H700')+wire('M860 260 H1060');
  content+=wire('M115 260 V105 H315')+wire('M445 105 H560 V232');
  content+=wire('M970 260 V490 H200 V288');
  if(stage===0)content+=wire('M970 260 V405 H810')+wire('M660 405 H560 V288')+box(660,370,150,70,'s + 1');
  content+=node(115,260)+node(970,260)+sum(200,260)+sum(560,260)+signs(200,260)+signs(560,260,true,stage===0);
  content+=box(320,215,130,90,'1','s + 2')+box(315,70,130,70,'5')+box(700,210,160,100,'1',stage===0?'s − 2':'2s − 1',stage===1);
  content+=text(65,300,'R(s)')+text(1030,235,'Y(s)')+text(490,242,'V','blocks-signal-label');
  if(stage===0)content+=text(645,242,'W','blocks-signal-label');
 }else if(stage===2){
  content+=wire('M35 260 H220')+wire('M350 260 H422')+wire('M478 260 H592',true)+wire('M648 260 H760')+wire('M920 260 H1060');
  content+=wire('M115 260 V115 H270')+wire('M400 115 H620 V232');
  content+=wire('M970 260 V485 H720',true)+wire('M570 485 H450 V288',true);
  content+=node(115,260)+node(970,260)+sum(450,260,true)+sum(620,260)+signs(450,260)+signs(620,260,true,false);
  content+=box(220,215,130,90,'1','s + 2')+box(270,80,130,70,'5')+box(760,210,160,100,'1','2s − 1')+box(570,440,150,90,'1','s + 2',true);
  content+=text(65,300,'R(s)')+text(1030,235,'Y(s)')+text(520,242,'V','blocks-signal-label');
 }else if(stage===3){
  content+=wire('M35 260 H300')+wire('M450 260 H592',true)+wire('M648 260 H760')+wire('M920 260 H1060');
  content+=wire('M115 260 V115 H300')+wire('M450 115 H620 V232',true);
  content+=wire('M970 260 V485 H850')+wire('M700 485 H620 V288',true);
  content+=node(115,260)+node(970,260)+sum(620,260,true)+signs(620,260,true,true);
  content+=box(300,215,150,90,'1','s + 2')+box(300,80,150,70,'5')+box(760,210,160,100,'1','2s − 1')+box(700,440,150,90,'1','s + 2');
  content+=text(65,300,'R(s)')+text(1030,235,'Y(s)');
 }else if(stage===4){
  content+=wire('M35 260 H180')+wire('M420 260 H502',true)+wire('M558 260 H700')+wire('M870 260 H1060');
  content+=wire('M970 260 V485 H840')+wire('M680 485 H530 V288');
  content+=node(970,260)+sum(530,260)+signs(530,260)+box(180,210,240,100,'5s + 11','s + 2',true)+box(700,210,170,100,'1','2s − 1')+box(680,440,160,90,'1','s + 2');
  content+=text(300,190,'P(s)','blocks-signal-label')+text(785,190,'F(s)','blocks-signal-label')+text(65,300,'R(s)')+text(1030,235,'Y(s)');
 }else if(stage===5){
  content+=wire('M35 260 H170')+wire('M400 260 H600')+wire('M900 260 H1060');
  content+=box(170,210,230,100,'5s + 11','s + 2')+box(600,200,300,120,'s + 2','2s² + 3s − 1',true);
  content+=text(285,190,'P(s)','blocks-signal-label')+text(750,180,'C(s)','blocks-signal-label')+text(65,300,'R(s)')+text(1030,235,'Y(s)');
 }else{
  content+=wire('M35 260 H330')+wire('M770 260 H1060')+box(330,200,440,120,'5s + 11','2s² + 3s − 1',true);
  content+=text(550,175,'G(s)','blocks-signal-label')+text(65,300,'R(s)')+text(1030,235,'Y(s)');
 }
 return content;
}
const secondBlockSteps=[
 {title:'Diagrama original con bloques G₁–G₆',rule:'Paso 0 · Identificar ramas, signos y punto de retorno',description:'G₂X entra negativamente al primer sumador y positivamente al segundo. El retorno G₅ es positivo y toma la señal Z después de G₄, antes de G₆.',equations:[String.raw`E=G_1X-G_2X+G_5Z`,String.raw`U=G_3E+G_2X,\qquad Z=G_4U,\qquad Y=G_6Z`],caution:'No se toma la realimentación de Y. G₆ está fuera del lazo. El signo del retorno por G₅ es positivo.',aria:'Original: G1X menos G2X más G5Z entra a G3; después se suma G2X, se pasa por G4 y se obtiene Z; G6 convierte Z en Y. G5 retorna desde Z con signo positivo.'},
 {title:'Combinar G₁ y la rama negativa de G₂',rule:'Paso 1 · Paralelo con signos opuestos',description:'Las dos contribuciones de X al primer sumador son G₁X y −G₂X. Se combinan en A = G₁ − G₂. La otra contribución de G₂X al segundo sumador se conserva.',equations:[String.raw`G_1X-G_2X=(G_1-G_2)X=AX`,String.raw`E=AX+G_5Z,\qquad U=G_3E+G_2X`],caution:'G₂ no desaparece de todo el diagrama: sigue en el camino que entra positivamente al segundo sumador.',aria:'La rama principal contiene A igual a G1 menos G2. Se suma positivamente G5Z antes de G3; G2X sigue llegando al segundo sumador.'},
 {title:'Mover el primer sumador después de G₃',rule:'Paso 2 · Desplazamiento de sumador con compensación',description:'La rama principal pasa por A y después por G₃. Para conservar G₃(AX + G₅Z), el retorno positivo pasa también por G₃ después de G₅.',equations:[String.raw`G_3E=G_3(AX+G_5Z)=AG_3X+G_5G_3Z`,String.raw`U=(AG_3X+G_5G_3Z)+G_2X`],caution:'Se añade una copia de G₃ en el retorno. La toma sigue en Z, antes de G₆, y el retorno sigue siendo positivo.',aria:'A y G3 quedan antes del primer sumador. El retorno desde Z atraviesa G5 y una copia de G3, con signo positivo. G2X se añade en el siguiente sumador.'},
 {title:'Reducir las series de avance y retorno',rule:'Paso 3 · Bloques en serie',description:'Se multiplican A y G₃ en la rama principal y G₅ y G₃ en la rama de retorno. No hay tomas entre esos bloques. Los dos sumadores todavía se mantienen separados.',equations:[String.raw`B=AG_3=(G_1-G_2)G_3,\qquad H=G_5G_3`,String.raw`U=(BX+HZ)+G_2X`],caution:'B y H son abreviaturas de las ramas equivalentes; G₄ y G₆ conservan su posición.',aria:'B igual a G1 menos G2 por G3 entra al primer sumador con retorno positivo H igual a G5G3. G2X se suma después.'},
 {title:'Combinar los dos sumadores',rule:'Paso 4 · Asociación de sumas',description:'Los sumadores son consecutivos y no tienen tomas intermedias. Se reemplazan por uno que recibe BX, G₂X y HZ con signo positivo.',equations:[String.raw`U=BX+G_2X+HZ`,String.raw`Z=G_4\bigl(BX+G_2X+HZ\bigr)`],caution:'Los tres signos son positivos en este paso. El signo negativo de la rama original de G₂ ya está incluido en B = (G₁ − G₂)G₃.',aria:'Un sumador recibe B por X, G2 por X y H por Z, los tres con signo positivo. G4 produce Z y G6 produce Y.'},
 {title:'Combinar los caminos que parten de X',rule:'Paso 5 · Paralelo de las ramas de entrada',description:'BX y G₂X comparten entrada y llegan positivamente al mismo sumador. Se combinan en P = B + G₂, que queda fuera del lazo de realimentación.',equations:[String.raw`P=B+G_2=(G_1-G_2)G_3+G_2`,String.raw`Z=G_4(PX+HZ),\qquad Y=G_6Z`],caution:'El lazo está formado por G₄ y H = G₅G₃. Ni P ni G₆ pertenecen al producto de realimentación.',aria:'X pasa por P igual a G1 menos G2 por G3 más G2, después al sumador de retorno positivo H por Z y a G4. G6 sigue después de Z.'},
 {title:'Cerrar el lazo de realimentación positiva',rule:'Paso 6 · Realimentación positiva',description:'El avance del lazo es G₄ y el retorno es H = G₅G₃. Al ser positivo se usa 1 − G₄H en el denominador. Quedan P, C y G₆ en serie.',equations:[String.raw`Z=G_4(PX+HZ)\;\Rightarrow\;(1-G_4H)Z=G_4PX`,String.raw`C=\frac{G_4}{1-G_4H}=\frac{G_4}{1-G_3G_4G_5}`],caution:'Usar 1 + G₃G₄G₅ daría otro sistema. G₆ no aparece en el denominador porque la toma de retorno está antes de ese bloque.',aria:'Tres bloques en serie: P igual a G1 menos G2 por G3 más G2; C igual a G4 sobre 1 menos G3G4G5; y G6.'},
 {title:'Obtener la función de transferencia final',rule:'Paso 7 · Serie y factorización',description:'Multiplicamos P, C y G₆. La contribución negativa de G₂ conserva el factor G₃; la positiva del segundo sumador no pasa por G₃.',equations:[String.raw`\frac{Y}{X}=PCG_6`,String.raw`\boxed{\frac{Y}{X}=\frac{G_4G_6\left[(G_1-G_2)G_3+G_2\right]}{1-G_3G_4G_5}}`,String.raw`\frac{Y}{X}=\frac{G_4G_6(G_1G_3-G_2G_3+G_2)}{1-G_3G_4G_5}`],caution:'La fórmula representa una interconexión bien definida cuando el denominador no es idénticamente nulo. Sus ceros aislados pueden producir polos, salvo cancelaciones.',aria:'Bloque equivalente G4G6 por G1G3 menos G2G3 más G2, dividido entre 1 menos G3G4G5.'}
];
function secondBlockDiagram(stage,prefix){
 const {wire,node,text,box,sum,defs}=blockDrawingTools(prefix);let content=defs;
 const sign=(x,y,top='',bottom='')=>text(x-42,y-16,'+')+(top?text(x+20,y-40,top):'')+(bottom?text(x+22,y+48,bottom):'');
 const io=()=>text(55,310,'X(s)')+text(1060,215,'Y(s)');
 if(stage===0){
  content+=wire('M35 270 H170')+wire('M280 270 H332')+wire('M388 270 H450')+wire('M560 270 H622')+wire('M678 270 H740')+wire('M850 270 H950')+wire('M1060 270 H1090');
  content+=wire('M100 270 V105 H170')+wire('M280 105 H650 V242')+wire('M360 105 V242');
  content+=wire('M900 270 V465 H720')+wire('M590 465 H360 V298');
  content+=node(100,270)+node(360,105)+node(900,270)+sum(360,270)+sum(650,270)+sign(360,270,'−','+')+sign(650,270,'+');
  content+=box(170,230,110,80,'G₁')+box(170,70,110,70,'G₂')+box(450,230,110,80,'G₃')+box(740,230,110,80,'G₄')+box(950,230,110,80,'G₆')+box(590,430,130,70,'G₅');
  content+=text(900,250,'Z','blocks-signal-label')+io();
 }else if(stage===1){
  content+=wire('M35 270 H155')+wire('M325 270 H362',true)+wire('M418 270 H490')+wire('M590 270 H652')+wire('M708 270 H770')+wire('M870 270 H970')+wire('M1070 270 H1090');
  content+=wire('M100 270 V115 H155')+wire('M285 115 H680 V242');
  content+=wire('M915 270 V465 H720')+wire('M590 465 H390 V298');
  content+=node(100,270)+node(915,270)+sum(390,270,true)+sum(680,270)+sign(390,270,'','+')+sign(680,270,'+');
  content+=box(155,220,170,100,'G₁ − G₂','',true)+box(155,80,130,70,'G₂')+box(490,230,100,80,'G₃')+box(770,230,100,80,'G₄')+box(970,230,100,80,'G₆')+box(590,430,130,70,'G₅');
  content+=text(240,200,'A(s)','blocks-signal-label')+text(915,250,'Z','blocks-signal-label')+io();
 }else if(stage===2||stage===3){
  if(stage===2){
   content+=wire('M35 270 H150')+wire('M310 270 H350')+wire('M450 270 H492',true);
   content+=box(150,220,160,100,'G₁ − G₂')+box(350,230,100,80,'G₃');
   content+=wire('M915 270 V465 H800')+wire('M700 465 H640',true)+wire('M540 465 H520 V298',true);
   content+=box(700,430,100,70,'G₅')+box(540,430,100,70,'G₃','',true);
   content+=wire('M100 270 V115 H150')+wire('M280 115 H680 V242')+box(150,80,130,70,'G₂');
  }else{
   content+=wire('M35 270 H220')+wire('M450 270 H492');
   content+=box(220,220,230,100,'(G₁ − G₂)G₃','',true)+text(335,200,'B(s)','blocks-signal-label');
   content+=wire('M915 270 V465 H820')+wire('M650 465 H520 V298');
   content+=box(650,430,170,70,'G₅G₃','',true)+text(735,410,'H(s)','blocks-signal-label');
   content+=wire('M100 270 V115 H220')+wire('M340 115 H680 V242')+box(220,80,120,70,'G₂');
  }
  content+=wire('M548 270 H652')+wire('M708 270 H770')+wire('M870 270 H970')+wire('M1070 270 H1090');
  content+=node(100,270)+node(915,270)+sum(520,270,stage===2)+sum(680,270)+sign(520,270,'','+')+sign(680,270,'+');
  content+=box(770,230,100,80,'G₄')+box(970,230,100,80,'G₆')+text(915,250,'Z','blocks-signal-label')+io();
 }else if(stage===4){
  content+=wire('M35 270 H220')+wire('M450 270 H652',true)+wire('M708 270 H770')+wire('M870 270 H970')+wire('M1070 270 H1090');
  content+=wire('M100 270 V115 H220')+wire('M340 115 H680 V242',true);
  content+=wire('M915 270 V465 H900')+wire('M750 465 H680 V298',true);
  content+=node(100,270)+node(915,270)+sum(680,270,true)+sign(680,270,'+','+');
  content+=box(220,220,230,100,'(G₁ − G₂)G₃')+box(220,80,120,70,'G₂')+box(770,230,100,80,'G₄')+box(970,230,100,80,'G₆')+box(750,430,150,70,'G₅G₃');
  content+=text(335,200,'B(s)','blocks-signal-label')+text(825,410,'H(s)','blocks-signal-label')+text(915,250,'Z','blocks-signal-label')+io();
 }else if(stage===5){
  content+=wire('M35 270 H120')+wire('M500 270 H572',true)+wire('M628 270 H740')+wire('M840 270 H950')+wire('M1050 270 H1090');
  content+=wire('M900 270 V465 H870')+wire('M720 465 H600 V298');
  content+=node(900,270)+sum(600,270)+sign(600,270,'','+');
  content+=box(120,210,380,120,'(G₁ − G₂)G₃ + G₂','',true)+box(740,230,100,80,'G₄')+box(950,230,100,80,'G₆')+box(720,430,150,70,'G₅G₃');
  content+=text(310,190,'P(s)','blocks-signal-label')+text(795,410,'H(s)','blocks-signal-label')+text(900,250,'Z','blocks-signal-label')+io();
 }else if(stage===6){
  content+=wire('M35 270 H110')+wire('M420 270 H500')+wire('M760 270 H900')+wire('M1000 270 H1090');
  content+=box(110,210,310,120,'(G₁ − G₂)G₃ + G₂')+box(500,210,260,120,'G₄','1 − G₃G₄G₅',true)+box(900,235,100,70,'G₆');
  content+=text(265,190,'P(s)','blocks-signal-label')+text(630,190,'C(s)','blocks-signal-label')+io();
 }else{
  content+=wire('M35 270 H180')+wire('M910 270 H1090')+box(180,210,730,120,'G₄G₆[(G₁ − G₂)G₃ + G₂]','1 − G₃G₄G₅',true)+text(545,185,'Y(s) / X(s)','blocks-signal-label')+io();
 }
 return content;
}
const thirdBlockSteps=[
 {title:'Original: salida por dos caminos',rule:'Paso 0 · Identificar la toma de realimentación',description:'Después de A = 1/(s + 2), la señal V se divide entre B = s/(s + 3) y la ganancia 2. La realimentación negativa toma W después de B, antes del sumador de salida.',equations:[String.raw`A=\frac1{s+2},\quad B=\frac{s}{s+3}`,String.raw`E=X-W,\quad V=AE,\quad W=BV,\quad Y=W+2V`],caution:'El retorno procede de W, no de Y. No se pueden combinar B y 2 sin conservar esa toma.',aria:'X menos W pasa por A y produce V; V atraviesa B para producir W y una rama de ganancia 2. W y 2V se suman para producir Y.'},
 {title:'Mover la toma de retorno antes de B',rule:'Paso 1 · Mover una toma con compensación',description:'En lugar de tomar W después de B, tomamos V antes de B y añadimos B a la rama de retorno. La señal que vuelve sigue siendo BV = W.',equations:[String.raw`W=BV\quad\Rightarrow\quad E=X-BV`,String.raw`V=A(X-BV),\qquad Y=(B+2)V`],caution:'La copia de B en el retorno es necesaria. Cambiar la toma sin ese bloque convertiría el retorno en V en lugar de W.',aria:'El retorno ahora parte de V y atraviesa una copia de B antes de entrar negativamente al sumador de entrada. Las ramas B y 2 siguen en paralelo hacia Y.'},
 {title:'Combinar B y 2 en paralelo',rule:'Paso 2 · Paralelo con la misma entrada',description:'Sin una toma intermedia exclusiva en B, las ramas B y 2 se suman en P. El bloque P queda fuera del lazo que produce V.',equations:[String.raw`P=B+2=\frac{s}{s+3}+2=\frac{3(s+2)}{s+3}`,String.raw`Y=PV,\qquad V=A(X-BV)`],caution:'La realimentación sigue tomando V antes de P; P no forma parte del producto de lazo.',aria:'X entra al sumador con retorno negativo B por V, atraviesa A y produce V; después P igual a 3 por s más 2 sobre s más 3 produce Y.'},
 {title:'Cerrar la realimentación negativa',rule:'Paso 3 · Realimentación negativa',description:'El avance es A y el retorno es B. El bloque equivalente C produce V a partir de X; P permanece después de ese lazo.',equations:[String.raw`C=\frac{A}{1+AB}=\frac{s+3}{(s+2)(s+3)+s}`,String.raw`C=\frac{s+3}{s^2+6s+6},\qquad Y=PCX`],caution:'El término adicional del denominador es +s, resultado del producto AB con realimentación negativa.',aria:'Dos bloques en serie: C igual a s más 3 sobre s cuadrado más 6s más 6, y P igual a 3 por s más 2 sobre s más 3.'},
 {title:'Multiplicar y simplificar',rule:'Paso 4 · Serie y cancelación de factores',description:'Multiplicamos C y P. El factor s + 3 se cancela y se obtiene la relación de salida a entrada.',equations:[String.raw`\frac{Y}{X}=\frac{s+3}{s^2+6s+6}\frac{3(s+2)}{s+3}`,String.raw`\boxed{\frac{Y}{X}=\frac{3(s+2)}{s^2+6s+6}}`],caution:'La comprobación final usa el retorno original W = BV y confirma el mismo denominador.',aria:'Un único bloque equivalente de numerador 3 por s más 2 y denominador s cuadrado más 6s más 6.'}
];
const fourthBlockSteps=[
 {title:'Original: avance, bypass y retorno',rule:'Paso 0 · Identificar las tres entradas de salida',description:'A = 1/(s + 3) lleva X directamente al sumador final. El camino central contiene B = (s + 2)/(s(s + 3)); además, E evita B por una rama de ganancia 1. La realimentación negativa toma V después de B y pasa por 2.',equations:[String.raw`A=\frac1{s+3},\quad B=\frac{s+2}{s(s+3)}`,String.raw`E=X-2V,\quad V=BE,\quad Y=AX+V+E`],caution:'La rama inferior que entra positivamente al sumador final transporta E, no X ni V.',aria:'X menos 2V produce E. E pasa por B para dar V y también evita B hacia el sumador final, que suma AX, V y E.'},
 {title:'Trasladar la toma del retorno a E',rule:'Paso 1 · Mover una toma con compensación',description:'Como V = BE, sustituimos el retorno 2V por 2BE tomado antes de B. La rama de bypass que transporta E no cambia.',equations:[String.raw`2V=2BE\quad\Rightarrow\quad E=X-2BE`,String.raw`Y=AX+BE+E`],caution:'El retorno equivalente contiene 2B. El puente sobre el cruce de cables indica que esas líneas no se conectan.',aria:'El retorno negativo ahora toma E y pasa por 2B. La salida mantiene las contribuciones AX, BE y E; un puente separa los cables que se cruzan.'},
 {title:'Combinar B y el bypass unitario',rule:'Paso 2 · Paralelo',description:'Las contribuciones BE y E se combinan en P = B + 1. El lazo que produce E conserva el retorno 2B.',equations:[String.raw`P=B+1=\frac{s^2+4s+2}{s(s+3)}`,String.raw`Y=AX+PE,\qquad E=X-2BE`],caution:'P no entra en la realimentación: la toma sigue siendo E antes de ese bloque.',aria:'E pasa por P igual a s cuadrado más 4s más 2 sobre s por s más 3 hacia el sumador final; el retorno negativo de E contiene 2B y AX sigue llegando por arriba.'},
 {title:'Cerrar el lazo que produce E',rule:'Paso 3 · Realimentación con avance unitario',description:'Entre el sumador de entrada y E hay avance 1. El retorno es 2B, por lo que E/X = 1/(1 + 2B). Después siguen P y la suma con AX.',equations:[String.raw`Q=\frac1{1+2B}=\frac{s(s+3)}{s(s+3)+2(s+2)}`,String.raw`Q=\frac{s(s+3)}{s^2+5s+4},\qquad Y=(PQ+A)X`],caution:'Aquí el numerador del lazo cerrado es 1, porque su salida es E, antes del bloque B original.',aria:'La rama principal desde X contiene Q y P en serie, y la rama superior A se suma positivamente al final.'},
 {title:'Reducir la serie QP',rule:'Paso 4 · Serie',description:'Se multiplican Q y P. El factor s(s + 3) se cancela y queda F en paralelo con A.',equations:[String.raw`F=QP=\frac{s(s+3)}{s^2+5s+4}\frac{s^2+4s+2}{s(s+3)}`,String.raw`F=\frac{s^2+4s+2}{s^2+5s+4},\qquad \frac{Y}{X}=F+A`],caution:'La rama A parte de X y se suma después de F. No debe multiplicarse por Q ni por P.',aria:'Dos ramas positivas en paralelo: F igual a s cuadrado más 4s más 2 sobre s cuadrado más 5s más 4, y A igual a 1 sobre s más 3.'},
 {title:'Sumar las ramas de entrada a salida',rule:'Paso 5 · Paralelo y denominador común',description:'Se suman F y A. El denominador s² + 5s + 4 factoriza como (s + 1)(s + 4).',equations:[String.raw`\frac{Y}{X}=\frac{s^2+4s+2}{s^2+5s+4}+\frac1{s+3}`,String.raw`\boxed{\frac{Y}{X}=\frac{s^3+8s^2+19s+10}{(s+1)(s+3)(s+4)}}`],caution:'La función también puede escribirse como 1 − 2/[(s + 1)(s + 3)(s + 4)].',aria:'Un único bloque equivalente de numerador s cúbico más 8s cuadrado más 19s más 10 y denominador s más 1 por s más 3 por s más 4.'}
];
const fifthBlockSteps=[
 {title:'Original: tres retornos negativos',rule:'Paso 0 · Identificar señales intermedias',description:'H₄ toma A después de H₁; H₆ toma B después de H₂ y antes de H₃; H₅ toma Y después de H₃. Los tres retornos entran con signo negativo.',equations:[String.raw`E=X-H_4A-H_6B,\quad A=H_1E`,String.raw`U=A-H_5Y,\quad B=H_2U,\quad Y=H_3B`],caution:'Las tomas de H₆ y H₅ son distintas: H₆ recibe B y H₅ recibe Y. No se pueden intercambiar sin compensar H₃.',aria:'X menos H4A menos H6B pasa por H1 para producir A; A menos H5Y pasa por H2 para producir B y por H3 para producir Y.'},
 {title:'Cerrar el lazo local de H₁ y H₄',rule:'Paso 1 · Realimentación negativa local',description:'El lazo alrededor de H₁ tiene retorno H₄. Conservamos X y −H₆B como entradas externas y lo sustituimos por F₁.',equations:[String.raw`A=H_1(X-H_4A-H_6B)`,String.raw`F_1=\frac{H_1}{1+H_1H_4},\qquad A=F_1(X-H_6B)`],caution:'La rama H₆ no desaparece: sigue entrando negativamente antes de F₁.',aria:'El primer lazo se reemplaza por F1 igual a H1 sobre 1 más H1H4; se mantiene el retorno negativo H6 por B y el segundo sumador con retorno H5 por Y.'},
 {title:'Mover la toma de H₅ antes de H₃',rule:'Paso 2 · Mover una toma con compensación',description:'Como Y = H₃B, el retorno H₅Y puede tomarse en B si su rama incluye H₃H₅. H₃ se mantiene también en el camino principal hacia Y.',equations:[String.raw`H_5Y=H_5H_3B`,String.raw`U=A-H_3H_5B,\qquad B=H_2U`],caution:'H₆ sigue tomando B sin pasar por H₃. Solo se compensa la rama que antes tomaba Y.',aria:'La rama de retorno al segundo sumador contiene ahora H3H5 y toma B antes de H3. La rama H6 también toma B, pero sin H3.'},
 {title:'Cerrar el lazo de H₂',rule:'Paso 3 · Realimentación negativa local',description:'El avance del segundo lazo es H₂ y su retorno equivalente es H₃H₅. Se reemplaza por F₂, dejando H₃ fuera del lazo restante.',equations:[String.raw`F_2=\frac{H_2}{1+H_2H_3H_5}`,String.raw`B=F_2A=F_2F_1(X-H_6B),\qquad Y=H_3B`],caution:'El retorno exterior H₆ continúa tomando B antes del bloque H₃.',aria:'F1 y F2 quedan en serie entre el primer sumador y B; el retorno negativo H6 parte de B; H3 está después de B.'},
 {title:'Multiplicar F₁ y F₂',rule:'Paso 4 · Serie',description:'Sin tomas intermedias, los dos lazos ya cerrados se combinan en F. El único retorno restante es H₆.',equations:[String.raw`D=(1+H_1H_4)(1+H_2H_3H_5)`,String.raw`F=F_1F_2=\frac{H_1H_2}{D},\qquad B=F(X-H_6B)`],caution:'D contiene el producto completo de los dos denominadores. No se sustituye por una suma.',aria:'Un bloque F igual a H1H2 sobre el producto de 1 más H1H4 y 1 más H2H3H5 recibe X menos H6B y produce B; H3 produce Y.'},
 {title:'Cerrar el retorno de H₆',rule:'Paso 5 · Realimentación negativa exterior',description:'Cerramos el lazo con avance F y retorno H₆. Su salida es B y el bloque H₃ permanece después.',equations:[String.raw`C=\frac{F}{1+FH_6}=\frac{H_1H_2}{D+H_1H_2H_6}`,String.raw`B=CX,\qquad Y=H_3B`],caution:'H₃ no forma parte de este retorno, porque H₆ toma B antes de H₃.',aria:'Quedan C igual a H1H2 sobre D más H1H2H6 y H3 en serie.'},
 {title:'Obtener la transferencia final',rule:'Paso 6 · Serie y expansión del denominador',description:'Se multiplica C por H₃. La forma factorizada conserva la estructura de los lazos y la expansión permite comprobar todos los términos.',equations:[String.raw`\boxed{\frac{Y}{X}=\frac{H_1H_2H_3}{(1+H_1H_4)(1+H_2H_3H_5)+H_1H_2H_6}}`,String.raw`D_{\rm total}=1+H_1H_4+H_2H_3H_5+H_1H_2H_6+H_1H_2H_3H_4H_5`],caution:'La fórmula supone bloques escalares y una interconexión bien definida. Mantener las tres tomas originales es esencial.',aria:'Bloque final H1H2H3 dividido entre el producto de 1 más H1H4 y 1 más H2H3H5, más H1H2H6.'}
];
function extraBlockTools(prefix){
 const tools=blockDrawingTools(prefix);
 tools.signedSum=(x,y,{left='+',top='',bottom='',active=false}={})=>tools.sum(x,y,active)+tools.text(x-42,y-16,left)+(top?tools.text(x+20,y-42,top):'')+(bottom?tools.text(x+22,y+48,bottom):'');
 return tools;
}
function thirdBlockDiagram(stage,prefix){
 const {wire,node,text,box,signedSum,defs}=extraBlockTools(prefix);let c=defs;
 if(stage<=2){
  c+=wire('M35 260 H162')+wire('M218 260 H300')+wire('M440 260 H500');
  c+=box(300,220,140,80,'1','s + 2')+node(500,260)+signedSum(190,260,{bottom:'−'});
  if(stage<=1){
   c+=wire('M500 260 H610')+wire('M750 260 H922')+wire('M978 260 H1060');
   c+=wire('M500 260 V110 H620')+wire('M740 110 H950 V232');
   c+=box(610,220,140,80,'s','s + 3')+box(620,75,120,70,'2')+signedSum(950,260,{top:'+'});
  }else c+=wire('M500 260 H650',true)+wire('M950 260 H1060')+box(650,200,300,120,'3(s + 2)','s + 3',true)+text(800,180,'P(s)','blocks-signal-label');
  if(stage===0)c+=node(800,260)+wire('M800 260 V460 H190 V288');
  else c+=wire('M500 260 V460 H440',stage===1)+wire('M300 460 H190 V288',stage===1)+box(300,420,140,80,'s','s + 3',stage===1);
  c+=text(480,242,'V','blocks-signal-label');if(stage===0)c+=text(800,242,'W','blocks-signal-label');
 }else if(stage===3){
  c+=wire('M35 260 H180')+wire('M480 260 H650')+wire('M950 260 H1060');
  c+=box(180,200,300,120,'s + 3','s² + 6s + 6',true)+box(650,200,300,120,'3(s + 2)','s + 3');
  c+=text(330,180,'C(s)','blocks-signal-label')+text(800,180,'P(s)','blocks-signal-label');
 }else c+=wire('M35 260 H330')+wire('M770 260 H1060')+box(330,200,440,120,'3(s + 2)','s² + 6s + 6',true);
 return c+text(60,300,'X(s)')+text(1030,235,'Y(s)');
}
function fourthBlockDiagram(stage,prefix,splitOutput=false){
 const {wire,node,text,box,signedSum,defs}=extraBlockTools(prefix);let c=defs;
 if(stage<=2){
  c+=wire('M35 260 H162')+wire('M218 260 H330')+node(100,260)+node(330,260)+signedSum(190,260,{bottom:'−'});
  c+=wire('M100 260 V110 H420')+wire('M550 110 H950 V232')+box(420,75,130,70,'1','s + 3');
  if(stage<=1){
   c+=wire('M330 260 H420')+wire(`M590 260 H${splitOutput||stage===1?822:922}`)+box(420,220,170,80,'s + 2','s(s + 3)');
   const crossing=stage===0?700:800;
   c+=wire(`M330 260 V390 H${crossing-12} Q${crossing} 376 ${crossing+12} 390 H${splitOutput||stage===1?850:950} V288`);
   if(stage===0)c+=node(700,260)+wire('M700 260 V490 H550')+wire('M420 490 H190 V288')+box(420,450,130,80,'2');
   else c+=node(330,350)+wire('M330 350 H800 V490 H640',true)+wire('M420 490 H190 V288',true)+box(420,450,220,80,'2(s + 2)','s(s + 3)',true);
   if(splitOutput||stage===1)c+=signedSum(850,260,{bottom:'+',active:splitOutput})+wire('M878 260 H922',splitOutput)+signedSum(950,260,{top:'+',active:splitOutput});
   else c+=signedSum(950,260,{top:'+',bottom:'+'});
  }else{
   c+=wire('M330 260 H550',true)+wire('M810 260 H922')+box(550,210,260,100,'s² + 4s + 2','s(s + 3)',true);
   c+=wire('M330 260 V350 H850 V490 H640')+wire('M420 490 H190 V288')+box(420,450,220,80,'2(s + 2)','s(s + 3)');
   c+=signedSum(950,260,{top:'+'})+text(680,190,'P(s)','blocks-signal-label');
  }
  c+=wire('M978 260 H1060')+text(330,242,'E','blocks-signal-label');if(stage===0)c+=text(700,242,'V','blocks-signal-label');
 }else if(stage===3||stage===4){
  c+=wire('M100 260 V110 H420')+wire('M550 110 H950 V232')+box(420,75,130,70,'1','s + 3')+node(100,260);
  c+=signedSum(950,260,{top:'+'})+wire('M978 260 H1060');
  if(stage===3){
   c+=wire('M35 260 H180')+wire('M430 260 H550')+wire('M810 260 H922');
   c+=box(180,210,250,100,'s(s + 3)','s² + 5s + 4',true)+box(550,210,260,100,'s² + 4s + 2','s(s + 3)');
   c+=text(305,190,'Q(s)','blocks-signal-label')+text(680,190,'P(s)','blocks-signal-label');
  }else c+=wire('M35 260 H350')+wire('M680 260 H922')+box(350,200,330,120,'s² + 4s + 2','s² + 5s + 4',true)+text(515,180,'F(s)','blocks-signal-label');
 }else c+=wire('M35 260 H200')+wire('M900 260 H1060')+box(200,200,700,120,'s³ + 8s² + 19s + 10','(s + 1)(s + 3)(s + 4)',true);
 return c+text(60,300,'X(s)')+text(1030,235,'Y(s)');
}
function fifthBlockDiagram(stage,prefix){
 const {wire,node,text,box,signedSum,defs}=extraBlockTools(prefix);let c=defs;
 if(stage===0){
  c+=wire('M35 300 H102')+wire('M158 300 H220')+wire('M330 300 H482')+wire('M538 300 H610')+wire('M720 300 H870')+wire('M980 300 H1090');
  c+=wire('M390 300 V100 H320')+wire('M220 100 H130 V272')+box(220,65,100,70,'H₄');
  c+=wire('M1030 300 V100 H880')+wire('M750 100 H510 V272')+box(750,65,130,70,'H₅');
  c+=wire('M780 300 V470 H570')+wire('M430 470 H130 V328')+box(430,435,140,70,'H₆');
  c+=signedSum(130,300,{top:'−',bottom:'−'})+signedSum(510,300,{top:'−'});
  c+=box(220,260,110,80,'H₁')+box(610,260,110,80,'H₂')+box(870,260,110,80,'H₃');
  c+=node(390,300)+node(780,300)+node(1030,300)+text(410,282,'A','blocks-signal-label')+text(780,282,'B','blocks-signal-label');
 }else if(stage===1||stage===2){
  c+=wire('M35 300 H102')+wire('M158 300 H230')+wire('M470 300 H522')+wire('M578 300 H650')+wire('M760 300 H910')+wire('M1020 300 H1090');
  c+=box(230,240,240,120,'H₁','1 + H₁H₄',stage===1)+box(650,260,110,80,'H₂')+box(910,260,110,80,'H₃');
  c+=signedSum(130,300,{bottom:'−'})+signedSum(550,300,{top:'−'})+node(820,300)+text(840,282,'B','blocks-signal-label');
  c+=wire('M820 300 V470 H570')+wire('M430 470 H130 V328')+box(430,435,140,70,'H₆');
  if(stage===1)c+=node(1050,300)+wire('M1050 300 V100 H890')+wire('M760 100 H550 V272')+box(760,65,130,70,'H₅');
  else c+=wire('M820 300 V180 H1000 V100 H940',true)+wire('M700 100 H550 V272',true)+box(700,65,240,70,'H₃H₅','',true);
  c+=text(350,220,'F₁(s)','blocks-signal-label');
 }else if(stage===3){
  c+=wire('M35 300 H102')+wire('M158 300 H220')+wire('M460 300 H600')+wire('M860 300 H950')+wire('M1060 300 H1090');
  c+=box(220,240,240,120,'H₁','1 + H₁H₄')+box(600,240,260,120,'H₂','1 + H₂H₃H₅',true)+box(950,260,110,80,'H₃');
  c+=node(900,300)+wire('M900 300 V470 H570')+wire('M430 470 H130 V328')+box(430,435,140,70,'H₆')+signedSum(130,300,{bottom:'−'});
  c+=text(340,220,'F₁(s)','blocks-signal-label')+text(730,220,'F₂(s)','blocks-signal-label')+text(900,282,'B','blocks-signal-label');
 }else if(stage===4){
  c+=wire('M35 300 H132')+wire('M188 300 H300')+wire('M800 300 H950')+wire('M1060 300 H1090');
  c+=box(300,230,500,140,'H₁H₂','(1 + H₁H₄)(1 + H₂H₃H₅)',true)+box(950,260,110,80,'H₃');
  c+=node(850,300)+wire('M850 300 V470 H570')+wire('M430 470 H160 V328')+box(430,435,140,70,'H₆')+signedSum(160,300,{bottom:'−'});
  c+=text(550,210,'F(s)','blocks-signal-label')+text(850,282,'B','blocks-signal-label');
 }else if(stage===5){
  c+=wire('M35 300 H120')+wire('M760 300 H920')+wire('M1030 300 H1090');
  c+=box(120,230,640,140,'H₁H₂','(1 + H₁H₄)(1 + H₂H₃H₅) + H₁H₂H₆',true)+box(920,260,110,80,'H₃')+text(440,210,'C(s)','blocks-signal-label');
 }else c+=wire('M35 300 H120')+wire('M980 300 H1090')+box(120,215,860,170,'H₁H₂H₃','(1 + H₁H₄)(1 + H₂H₃H₅) + H₁H₂H₆',true);
 return c+text(60,340,'X(s)')+text(1060,370,'Y(s)');
}
function splitFirstBlockDiagram(prefix){
 const {wire,node,text,box,signedSum,defs}=extraBlockTools(prefix);let c=defs;
 c+=wire('M35 260 H172')+wire('M228 260 H310')+wire('M430 260 H492')+wire('M548 260 H622',true)+wire('M678 260 H760')+wire('M910 260 H1090');
 c+=wire('M115 260 V105 H310')+wire('M430 105 H520 V232',true)+box(310,70,120,70,'5');
 c+=wire('M970 260 V405 H860')+wire('M720 405 H650 V288',true)+box(720,370,140,70,'s + 1');
 c+=wire('M970 260 V500 H200 V288');
 c+=node(115,260)+node(970,260)+box(310,215,120,90,'1','s + 2')+box(760,210,150,100,'1','s − 2');
 c+=signedSum(200,260,{bottom:'−'})+signedSum(520,260,{top:'+',active:true})+signedSum(650,260,{bottom:'−',active:true});
 return c+text(65,300,'R(s)')+text(1040,235,'Y(s)')+text(465,242,'V','blocks-signal-label')+text(585,242,'U','blocks-signal-label');
}
function splitSecondBlockDiagram(prefix){
 const {wire,node,text,box,signedSum,defs}=extraBlockTools(prefix);let c=defs;
 c+=wire('M35 270 H170')+wire('M270 270 H322')+wire('M378 270 H442',true)+wire('M498 270 H570')+wire('M670 270 H732')+wire('M788 270 H830')+wire('M930 270 H990')+wire('M1070 270 H1090');
 c+=wire('M100 270 V105 H170')+wire('M270 105 H760 V242')+wire('M350 105 V242',true);
 c+=wire('M950 270 V465 H750')+wire('M620 465 H470 V298',true);
 c+=box(170,230,100,80,'G₁')+box(170,70,100,70,'G₂')+box(570,230,100,80,'G₃')+box(830,230,100,80,'G₄')+box(990,230,80,80,'G₆')+box(620,430,130,70,'G₅');
 c+=node(100,270)+node(350,105)+node(950,270)+signedSum(350,270,{top:'−',active:true})+signedSum(470,270,{bottom:'+',active:true})+signedSum(760,270,{top:'+'});
 return c+text(55,310,'X(s)')+text(1060,215,'Y(s)')+text(950,250,'Z','blocks-signal-label');
}
function splitFifthBlockDiagram(prefix){
 const {wire,node,text,box,signedSum,defs}=extraBlockTools(prefix);let c=defs;
 c+=wire('M35 300 H72')+wire('M128 300 H172',true)+wire('M228 300 H290')+wire('M400 300 H542')+wire('M598 300 H660')+wire('M770 300 H910')+wire('M1020 300 H1090');
 c+=wire('M440 300 V100 H380')+wire('M280 100 H200 V272',true)+box(280,65,100,70,'H₄');
 c+=wire('M1050 300 V100 H930')+wire('M800 100 H570 V272')+box(800,65,130,70,'H₅');
 c+=wire('M820 300 V470 H570')+wire('M430 470 H100 V328',true)+box(430,435,140,70,'H₆');
 c+=box(290,260,110,80,'H₁')+box(660,260,110,80,'H₂')+box(910,260,110,80,'H₃');
 c+=node(440,300)+node(820,300)+node(1050,300)+signedSum(100,300,{bottom:'−',active:true})+signedSum(200,300,{top:'−',active:true})+signedSum(570,300,{top:'−'});
 return c+text(40,340,'X(s)')+text(1060,370,'Y(s)')+text(460,282,'A','blocks-signal-label')+text(840,282,'B','blocks-signal-label');
}
function withCascadeStep(steps,step){
 steps.splice(1,0,step);steps.forEach((entry,index)=>{entry.rule=entry.rule.replace(/^Paso \d+/,`Paso ${index}`);});
}
withCascadeStep(firstBlockSteps,{title:'Separar el sumador de tres entradas',rule:'Paso 1 · Regla 2: dos sumadores en cascada',description:'Primero se suman V y 5R; después se resta HY. Los dos nuevos sumadores reciben solo dos entradas. El segundo queda dentro del lazo que se cerrará a continuación.',equations:[String.raw`W=V+5R-HY`,String.raw`U=V+5R,\qquad W=U-HY,\qquad Y=G_2W`],caution:'Se mantienen las tomas y los signos. El primer sumador aporta U al lazo interno, sin formar parte de su retorno.',aria:'V y 5R se suman para producir U. Un segundo sumador resta H por Y a U antes de G2. El retorno exterior sigue negativo al primer sumador de entrada.'});
withCascadeStep(secondBlockSteps,{title:'Separar las tres entradas del primer sumador',rule:'Paso 1 · Regla 2: dos sumadores en cascada',description:'Un sumador forma G₁X − G₂X; el siguiente añade G₅Z. La otra rama G₂X sigue entrando positivamente al sumador situado después de G₃.',equations:[String.raw`E=G_1X-G_2X+G_5Z`,String.raw`A_0=G_1X-G_2X,\qquad E=A_0+G_5Z`],caution:'La entrada negativa G₂X y el retorno positivo G₅Z se asignan a sumadores distintos, conservando exactamente su suma.',aria:'G1X menos G2X pasa por el primer sumador, y G5Z se añade en otro sumador consecutivo antes de G3; la rama G2X al segundo sumador original permanece.'});
withCascadeStep(fourthBlockSteps,{title:'Separar el sumador de salida',rule:'Paso 1 · Regla 2: dos sumadores en cascada',description:'Primero se suman V y el bypass E; después se añade la rama AX. El retorno de ganancia 2 sigue tomando V antes de estos dos sumadores.',equations:[String.raw`Y=V+E+AX`,String.raw`U=V+E,\qquad Y=U+AX`],caution:'Los tres signos son positivos. El punto de retorno no se desplaza al separar el sumador.',aria:'V y E se suman primero para producir U. Un sumador posterior añade AX y produce Y; el retorno 2V conserva su toma antes de esos sumadores.'});
withCascadeStep(fifthBlockSteps,{title:'Separar las entradas del primer sumador',rule:'Paso 1 · Regla 2 y reordenación de la regla 1',description:'Reordenamos los términos negativos conservando sus signos (regla 1) y separamos el sumador (regla 2). Un primer sumador forma X − H₆B. El siguiente resta H₄A antes de H₁. Así se aísla el lazo local H₁–H₄ para cerrarlo en el próximo paso.',equations:[String.raw`E=X-H_4A-H_6B=(X-H_6B)-H_4A`,String.raw`E_0=X-H_6B,\qquad E=E_0-H_4A,\qquad A=H_1E`],caution:'Ambos retornos siguen siendo negativos y conservan sus puntos de toma: H₄ recibe A y H₆ recibe B.',aria:'Un primer sumador resta H6B a X. Un segundo resta H4A antes de H1; el resto del diagrama y el retorno H5 desde Y se mantienen.'});
function diagramWithCascade(draw,split){return (stage,prefix)=>stage===0?draw(0,prefix):stage===1?split(prefix):draw(stage-1,prefix);}
const blockExamples=[
 {steps:firstBlockSteps,diagram:diagramWithCascade(firstBlockDiagram,splitFirstBlockDiagram),intro:'En el primer ejemplo, R(s) llega al primer sumador y al bloque 5. Y(s) vuelve negativamente a los dos sumadores: directamente al primero y a través de s + 1 al segundo.',result:[String.raw`\boxed{\frac{Y(s)}{R(s)}=\frac{5s+11}{2s^2+3s-1}}`,String.raw`\text{Comprobación desde el original:}`,String.raw`(s-2)Y=\frac{R-Y}{s+2}+5R-(s+1)Y`,String.raw`\left[(2s-1)(s+2)+1\right]Y=\left[5(s+2)+1\right]R`,String.raw`(2s^2+3s-1)Y=(5s+11)R`]},
 {steps:secondBlockSteps,diagram:diagramWithCascade(secondBlockDiagram,splitSecondBlockDiagram),intro:'En el segundo ejemplo, G₂X entra con signo negativo al primer sumador y positivo al segundo. El retorno por G₅ es positivo y toma Z antes de G₆. Los bloques G₁ a G₆ representan funciones de s y se tratan como sistemas escalares.',result:[String.raw`\boxed{\frac{Y(s)}{X(s)}=\frac{G_4G_6(G_1G_3-G_2G_3+G_2)}{1-G_3G_4G_5}}`,String.raw`\text{Comprobación desde el original:}`,String.raw`Z=G_4\left[G_3(G_1X-G_2X+G_5Z)+G_2X\right],\quad Y=G_6Z`,String.raw`(1-G_3G_4G_5)Z=G_4(G_1G_3-G_2G_3+G_2)X`,String.raw`(1-G_3G_4G_5)Y=G_4G_6(G_1G_3-G_2G_3+G_2)X`]},
 {steps:thirdBlockSteps,diagram:thirdBlockDiagram,intro:'Ejemplo 3: la señal tras 1/(s + 2) se divide entre s/(s + 3) y una ganancia 2. La realimentación negativa toma la salida de s/(s + 3), antes del sumador final.',result:[String.raw`\boxed{\frac{Y}{X}=\frac{3(s+2)}{s^2+6s+6}}`,String.raw`\text{Comprobación desde el original:}`,String.raw`V=\frac{X-W}{s+2},\quad W=\frac{s}{s+3}V,\quad Y=W+2V`,String.raw`\left[(s+2)(s+3)+s\right]V=(s+3)X`,String.raw`Y=\frac{3(s+2)}{s+3}V\quad\Rightarrow\quad (s^2+6s+6)Y=3(s+2)X`]},
 {steps:fourthBlockSteps,diagram:diagramWithCascade(fourthBlockDiagram,prefix=>fourthBlockDiagram(0,prefix,true)),intro:'Ejemplo 4: hay una rama de avance 1/(s + 3), una rama de bypass desde la salida del primer sumador y un retorno negativo de ganancia 2 desde la salida de (s + 2)/(s(s + 3)).',result:[String.raw`\boxed{\frac{Y}{X}=\frac{s^3+8s^2+19s+10}{(s+1)(s+3)(s+4)}}`,String.raw`\text{Comprobación desde el original:}`,String.raw`E=X-2V,\quad s(s+3)V=(s+2)E,\quad Y=E+V+\frac{X}{s+3}`,String.raw`\frac{E}{X}=\frac{s(s+3)}{s^2+5s+4},\quad \frac{V}{X}=\frac{s+2}{s^2+5s+4}`,String.raw`\frac{Y}{X}=\frac{s^2+4s+2}{s^2+5s+4}+\frac1{s+3}=1-\frac2{(s+1)(s+3)(s+4)}`]},
 {steps:fifthBlockSteps,diagram:diagramWithCascade(fifthBlockDiagram,splitFifthBlockDiagram),intro:'Ejemplo 5: los tres retornos son negativos. H₄ recibe la salida de H₁; H₆ recibe la salida de H₂ antes de H₃; H₅ recibe la salida final Y. Los bloques Hᵢ(s) se tratan como sistemas escalares.',result:[String.raw`\boxed{\frac{Y}{X}=\frac{H_1H_2H_3}{(1+H_1H_4)(1+H_2H_3H_5)+H_1H_2H_6}}`,String.raw`\text{Comprobación desde el original:}`,String.raw`A=H_1(X-H_4A-H_6B),\quad B=H_2(A-H_5Y),\quad Y=H_3B`,String.raw`(1+H_1H_4)A=H_1X-H_1H_6B,\quad (1+H_2H_3H_5)B=H_2A`,String.raw`\left[(1+H_1H_4)(1+H_2H_3H_5)+H_1H_2H_6\right]B=H_1H_2X`]}
];
const blockStepRuleReferences=[
 [[],[2],[13],[7],[2],[5],[13],[4]],
 [[],[2],[5],[7],[4],[2],[5],['positive'],[4]],
 [[],[8],[5],[13],[4]],
 [[],[2],[8],[5],[13],[4],[5]],
 [[],[1,2],[13],[8],[13],[4],[13],[4]]
];
const blockStepSelect=document.querySelector('#blocks-step'),blockCompare=document.querySelector('#blocks-compare'),blockExampleSelect=document.querySelector('#blocks-example');
let blockExampleIndex=0,blockSteps=firstBlockSteps,blockCurrent=0,blockMathVersion=0,blockMathQueue=Promise.resolve();
function blockDiagram(stage,prefix){return blockExamples[blockExampleIndex].diagram(stage,prefix);}
function selectBlockExample(index){
 if(!blockExamples[index])return;
 blockExampleIndex=index;blockExampleSelect.value=String(index);blockSteps=blockExamples[index].steps;blockCurrent=0;blockStepSelect.replaceChildren();
 blockSteps.forEach((step,i)=>{const option=document.createElement('option');option.value=i;option.textContent=`${i} · ${step.title}`;blockStepSelect.append(option);});
 document.querySelector('#blocks-example-description').textContent=blockExamples[index].intro;renderBlockStep();
}
function renderBlockStep(){
 const step=blockSteps[blockCurrent],version=++blockMathVersion;
 blockStepSelect.value=blockCurrent;document.querySelector('#blocks-prev').disabled=blockCurrent===0;document.querySelector('#blocks-next').disabled=blockCurrent===blockSteps.length-1;
 document.querySelector('#blocks-progress').textContent=`Paso ${blockCurrent} de ${blockSteps.length-1} · ${step.rule.split(' · ')[1]}`;
 document.querySelector('#blocks-rule-name').textContent=step.rule;document.querySelector('#blocks-title').textContent=step.title;document.querySelector('#blocks-explanation').textContent=step.description;document.querySelector('#blocks-caution').textContent=step.caution;
 const references=document.querySelector('#blocks-rule-reference');references.replaceChildren();
 const numbers=blockStepRuleReferences[blockExampleIndex][blockCurrent];
 if(!numbers.length)references.textContent='Diagrama original: todavía no se aplica ninguna regla.';
 else{references.append('Consultar: ');numbers.forEach((number,index)=>{if(index)references.append(' · ');const link=document.createElement('a');link.href=`#block-rule-${number}`;link.textContent=number==='positive'?'Regla complementaria: realimentación positiva':`Regla ${number} de la tabla`;references.append(link);});}
 const svg=document.querySelector('#blocks-diagram');svg.innerHTML=blockDiagram(blockCurrent,'blocks-current');svg.setAttribute('aria-label',step.aria);
 const compare=blockCompare.checked,previousIndex=Math.max(0,blockCurrent-1);document.querySelector('#blocks-previous-card').hidden=!compare;document.querySelector('#blocks-diagrams-row').classList.toggle('is-comparing',compare);
 document.querySelector('#blocks-previous-card h3').textContent=blockCurrent===0?'Diagrama original':'Antes de este paso';
 const previous=document.querySelector('#blocks-previous');if(compare){previous.innerHTML=blockDiagram(previousIndex,'blocks-before');previous.setAttribute('aria-label',blockSteps[previousIndex].aria);}else previous.replaceChildren();
 document.querySelector('#blocks-result').hidden=blockCurrent!==blockSteps.length-1;
 blockMathQueue=blockMathQueue.catch(()=>{}).then(async()=>{
  if(window.MathJax?.startup?.promise)await window.MathJax.startup.promise;if(version!==blockMathVersion)return;
  const host=document.querySelector('#blocks-math'),result=document.querySelector('#blocks-result-math');window.MathJax?.typesetClear?.([host,result]);
  const paragraphs=equations=>equations.map(equation=>{const p=document.createElement('p');p.textContent=`\\[${equation}\\]`;return p;});
  host.replaceChildren(...paragraphs(step.equations));result.replaceChildren(...(blockCurrent===blockSteps.length-1?paragraphs(blockExamples[blockExampleIndex].result):[]));
  if(window.MathJax?.typesetPromise)await window.MathJax.typesetPromise([host,result]);
 });
}
document.querySelector('#blocks-prev').addEventListener('click',()=>{blockCurrent=Math.max(0,blockCurrent-1);renderBlockStep();});
document.querySelector('#blocks-next').addEventListener('click',()=>{blockCurrent=Math.min(blockSteps.length-1,blockCurrent+1);renderBlockStep();});
blockStepSelect.addEventListener('change',()=>{blockCurrent=Number(blockStepSelect.value);renderBlockStep();});blockCompare.addEventListener('change',renderBlockStep);blockExampleSelect.addEventListener('change',()=>selectBlockExample(Number(blockExampleSelect.value)));selectBlockExample(0);

const blockRules=[
 {id:'reorder',title:'1 · Reordenar sumas en cascada',before:String.raw`(A-B)+C`,after:String.raw`(A+C)-B`,note:'Se pueden reordenar entradas conservando su signo si no hay tomas ni bloques entre los sumadores.'},
 {id:'split',title:'2 · Separar un sumador de tres entradas',before:String.raw`Y=A-B+C`,after:String.raw`U=A-B,\quad Y=U+C`,note:'La asociación de sumas permite separar el sumador en dos de dos entradas; la operación inversa también es válida.'},
 {id:'commute',title:'3 · Intercambiar bloques en serie',before:String.raw`Y=G_2G_1A`,after:String.raw`Y=G_1G_2A`,note:'Solo para bloques escalares, sin ramas ni tomas intermedias. Los sistemas matriciales no conmutan en general.'},
 {id:'series',title:'4 · Reducir una serie',before:String.raw`A\longrightarrow G_1\longrightarrow G_2`,after:String.raw`Y=(G_1G_2)A`,note:'Se multiplican las transferencias de bloques consecutivos, sin conexiones intermedias que utilicen otra señal.'},
 {id:'parallel',title:'5 · Reducir ramas en paralelo',before:String.raw`Y=G_1A+G_2A`,after:String.raw`Y=(G_1+G_2)A`,note:'Ambas ramas deben recibir la misma entrada. Si una entra con signo negativo, se usa G₁ − G₂.'},
 {id:'sumBefore',title:'6 · Mover un sumador antes de G',before:String.raw`Y=GA-B`,after:String.raw`Y=G\left(A-\frac BG\right)`,note:'La entrada lateral se divide por G. Esta forma requiere que la inversión de G tenga sentido; no se aplica si G es idénticamente cero.'},
 {id:'sumAfter',title:'7 · Mover un sumador después de G',before:String.raw`Y=G(A-B)`,after:String.raw`Y=GA-GB`,note:'Cada entrada lateral debe pasar por una copia de G, conservando el signo que tenía.'},
 {id:'takeBefore',title:'8 · Mover una toma antes de G',before:String.raw`Y=GA,\quad Z=GA`,after:String.raw`Y=GA,\quad Z=G\,A`,note:'La rama desplazada recibe una copia de G para transportar la misma señal que tomaba a la salida.'},
 {id:'takeAfter',title:'9 · Mover una toma después de G',before:String.raw`Y=GA,\quad Z=A`,after:String.raw`Y=GA,\quad Z=\frac1G\,Y`,note:'La rama desplazada incluye 1/G. Requiere una inversa algebraica válida; un bloque inverso puede no ser realizable físicamente.'},
 {id:'splitBranches',title:'10 · Separar un sumador con varias salidas',before:String.raw`Y=A-B,\quad Z=A-B`,after:String.raw`Y=A-B,\quad Z=A-B`,note:'La toma se lleva antes del sumador y se duplica el sumador. Ambas copias reciben A y B con los mismos signos.'},
 {id:'factorBranch',title:'11 · Mover la toma entre ramas paralelas',before:String.raw`Y=G_1A+G_2A`,after:String.raw`Y=G_1A+\frac{G_2}{G_1}(G_1A)`,note:'La segunda rama toma ahora la salida de G₁ y se compensa con G₂/G₁. Requiere una inversa algebraica de G₁.'},
 {id:'unity',title:'12 · Convertir a realimentación unitaria',before:String.raw`Y=G_1(A-G_2Y)`,after:String.raw`\frac YA=\frac1{G_2}\frac{G_1G_2}{1+G_1G_2}`,note:'G₂ pasa al camino directo y se añade 1/G₂ antes del sumador. El retorno queda unitario. Requiere una inversa algebraica de G₂.'},
 {id:'negative',title:'13 · Cerrar una realimentación negativa',before:String.raw`Y=G_1(A-G_2Y)`,after:String.raw`\frac YA=\frac{G_1}{1+G_1G_2}`,note:'El signo negativo en el sumador produce 1 + G₁G₂ en el denominador. Se conserva la numeración de la tabla del alumnado.'}
];
const complementaryBlockRules=[
 {id:'positive',title:'Complementaria · Realimentación positiva',before:String.raw`Y=G(A+HY)`,after:String.raw`\frac YA=\frac G{1-GH}`,note:'No forma parte de las 13 reglas de la tabla. El signo positivo produce 1 − GH; se utiliza en el ejemplo 2.'}
];
function blockRuleDiagram(kind,equivalent,prefix){
 const {wire,node,text,box,signedSum,sum,defs}=extraBlockTools(prefix);let c=defs;
 const input=()=>text(32,101,'A','blocks-signal-label');
 const output=()=>text(485,101,'Y','blocks-signal-label','end');
 if(kind==='reorder'||kind==='split'){
  if(kind==='split'&&!equivalent){
   c+=wire('M35 120 H227')+wire('M283 120 H490')+wire('M255 35 V92')+wire('M255 215 V148')+signedSum(255,120,{top:'+',bottom:'−'});
   c+=text(230,42,'C','blocks-signal-label')+text(230,212,'B','blocks-signal-label');
  }else{
   const reordered=kind==='reorder'&&equivalent;
   c+=wire('M35 120 H122')+wire('M178 120 H322')+wire('M378 120 H490');
   c+=wire('M150 215 V148')+wire('M350 215 V148');
   c+=signedSum(150,120,{bottom:reordered?'+':'−'})+signedSum(350,120,{bottom:reordered?'−':'+'});
   c+=text(130,212,reordered?'C':'B','blocks-signal-label')+text(330,212,reordered?'B':'C','blocks-signal-label');
  }
 }else if(kind==='series'||kind==='commute'){
  if(kind==='series'&&equivalent)c+=wire('M35 120 H185')+wire('M365 120 H490')+box(185,80,180,80,'G₁G₂');
  else c+=wire('M35 120 H110')+wire('M210 120 H290')+wire('M390 120 H490')+box(110,85,100,70,kind==='commute'&&equivalent?'G₂':'G₁')+box(290,85,100,70,kind==='commute'&&equivalent?'G₁':'G₂');
 }else if(kind==='parallel'){
  if(equivalent)c+=wire('M35 120 H185')+wire('M365 120 H490')+box(185,80,180,80,'G₁ + G₂');
  else{
   c+=wire('M35 120 H80')+node(80,120)+wire('M80 120 V65 H160')+wire('M80 120 V185 H160');
   c+=box(160,35,100,60,'G₁')+box(160,155,100,60,'G₂')+wire('M260 65 H400 V92')+wire('M260 185 H400 V148')+sum(400,120)+text(420,80,'+')+text(420,167,'+')+wire('M428 120 H490');
  }
 }else if(kind==='sumBefore'||kind==='sumAfter'){
  const sumFirst=(kind==='sumBefore'&&equivalent)||(kind==='sumAfter'&&!equivalent);
  if(sumFirst){
   c+=wire('M35 120 H122')+wire('M178 120 H300')+wire('M400 120 H490')+signedSum(150,120,{bottom:'−'})+box(300,85,100,70,'G');
   if(kind==='sumBefore')c+=wire('M485 210 H360')+box(260,180,100,60,'1','G')+wire('M260 210 H150 V148')+text(480,193,'B','blocks-signal-label');
   else c+=wire('M150 215 V148')+text(130,212,'B','blocks-signal-label');
  }else{
   c+=wire('M35 120 H110')+wire('M210 120 H312')+wire('M368 120 H490')+box(110,85,100,70,'G')+signedSum(340,120,{bottom:'−'});
   if(kind==='sumAfter')c+=wire('M35 210 H150')+box(150,180,100,60,'G')+wire('M250 210 H340 V148')+text(30,193,'B','blocks-signal-label');
   else c+=wire('M340 215 V148')+text(320,212,'B','blocks-signal-label');
  }
 }else if(kind==='takeBefore'||kind==='takeAfter'){
  const early=(kind==='takeBefore'&&equivalent)||(kind==='takeAfter'&&!equivalent);
  c+=wire('M35 120 H170')+box(170,85,100,70,'G')+wire('M270 120 H490');
  if(early){
   c+=node(100,120)+wire('M100 120 V210 H170');
   if(kind==='takeBefore')c+=box(170,180,100,60,'G')+wire('M270 210 H490');else c+=wire('M170 210 H490');
  }else{
   c+=node(350,120);
   if(kind==='takeAfter')c+=wire('M350 120 V210 H370')+box(370,180,100,60,'1','G')+wire('M470 210 H500');
   else c+=wire('M350 120 V210 H490');
  }
  c+=text(505,237,'Z','blocks-signal-label','end');
 }else if(kind==='splitBranches'){
  if(!equivalent){
   c+=wire('M35 120 H152')+signedSum(180,120,{bottom:'−'})+wire('M180 220 V148')+text(155,217,'B')+wire('M208 120 H490')+node(350,120)+wire('M350 120 V210 H490');
  }else{
   c+=wire('M35 120 H75')+node(75,120)+wire('M75 120 V65 H252')+wire('M75 120 V175 H252');
   c+=signedSum(280,65,{bottom:'−'})+signedSum(280,175,{bottom:'−'})+wire('M308 65 H490')+wire('M308 175 H490');
   c+=wire('M140 230 H280 V203')+node(140,230)+wire('M140 230 V120 H280 V93')+text(115,230,'B');
  }
  c+=text(505,237,'Z','blocks-signal-label','end');
 }else if(kind==='factorBranch'){
  if(!equivalent)return blockRuleDiagram('parallel',false,prefix);
  c+=wire('M35 120 H95')+box(95,85,100,70,'G₁')+wire('M195 120 H392')+node(240,120)+wire('M240 120 V210 H270')+box(270,175,100,70,'G₂','G₁')+wire('M370 210 H420 V148')+signedSum(420,120,{bottom:'+'})+wire('M448 120 H490');
 }else if(kind==='unity'&&equivalent){
  c+=wire('M35 120 H65')+box(65,85,80,70,'1','G₂')+wire('M145 120 H192')+signedSum(220,120,{bottom:'−'})+wire('M248 120 H280')+box(280,85,70,70,'G₂')+wire('M350 120 H375')+box(375,85,70,70,'G₁')+wire('M445 120 H500')+node(470,120)+wire('M470 120 V215 H220 V148');
 }else{
  const positive=kind==='positive',forward=positive?'G':'G₁',feedback=positive?'H':'G₂';
  if(equivalent)c+=wire('M35 120 H160')+box(160,75,230,90,forward,positive?'1 − GH':'1 + G₁G₂')+wire('M390 120 H490');
  else{
   c+=wire('M35 120 H92')+signedSum(120,120,{bottom:positive?'+':'−'})+wire('M148 120 H230')+box(230,85,100,70,forward)+wire('M330 120 H490');
   c+=node(390,120)+wire('M390 120 V210 H330')+box(230,180,100,60,feedback)+wire('M230 210 H120 V148');
  }
 }
 return c+input()+output();
}
function createBlockRulesTable(rules,captionText){
 const table=document.createElement('table');table.className='blocks-rules-table';
 const caption=document.createElement('caption');caption.textContent=captionText;table.append(caption);
 const head=document.createElement('thead');head.innerHTML='<tr><th scope="col">Regla y condiciones</th><th scope="col">Diagrama original</th><th scope="col">Diagrama equivalente</th></tr>';table.append(head);
 const body=document.createElement('tbody');
 rules.forEach((rule,index)=>{
  const row=document.createElement('tr'),heading=document.createElement('th');row.id=rule.id==='positive'?'block-rule-positive':`block-rule-${index+1}`;heading.scope='row';heading.textContent=rule.title;const note=document.createElement('p');note.textContent=rule.note;heading.append(note);row.append(heading);
  for(const equivalent of [false,true]){
   const cell=document.createElement('td'),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 520 250');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${rule.title}: ${equivalent?'equivalente':'original'}`);svg.classList.add('blocks-rule-diagram');svg.innerHTML=blockRuleDiagram(rule.id,equivalent,`rule-${rule.id}-${equivalent?'after':'before'}`);cell.append(svg);
   const formula=document.createElement('p');formula.textContent=`\\[${equivalent?rule.after:rule.before}\\]`;cell.append(formula);row.append(cell);
  }
  body.append(row);
 });table.append(body);return table;
}
function renderBlockRules(){
 const table=createBlockRulesTable(blockRules,'Tabla del alumnado: 13 reglas de álgebra de bloques');
 const supplement=createBlockRulesTable(complementaryBlockRules,'Regla complementaria: realimentación positiva');
 document.querySelector('#blocks-rules-reference').replaceChildren(table);
 document.querySelector('#blocks-complement-reference').replaceChildren(supplement);
 // La tabla se crea durante la carga; se incluye explícitamente si MathJax ya terminó su pasada inicial.
 if(window.MathJax?.startup?.promise)window.MathJax.startup.promise.then(()=>window.MathJax.typesetPromise?.([table,supplement])).catch(()=>{});
}

renderBlockRules();


const blockShowRules = document.querySelector('#blocks-show-rules');
function updateBlockRulesVisibility() {
 const visible = blockShowRules.checked;
 document.body.classList.toggle('blocks-rules-hidden', !visible);
 for (const id of ['blocks-rule-panel', 'blocks-rule-name', 'blocks-explanation', 'blocks-rule-reference']) {
  document.getElementById(id).hidden = !visible;
 }
}
blockShowRules.addEventListener('change', updateBlockRulesVisibility);
updateBlockRulesVisibility();
