import {CODES,OFFER_MIN,lock,unlock,LOCK,goToSection} from './app.js';

/* ===================== WHEEL (عجلة الحظ) — JS =====================
   كل حاجة في الـ IIFE دي لوحدها. بتعتمد (اختياريًا) على lock()/unlock() و CODES بتوع المتجر.
   API:  ElcobyWheel.open()   يفتح العجلة (لو اتلفّت قبل كده بيعرض الجايزة بس)
         ElcobyWheel.reset()  يمسح الحالة المحفوظة (للتجربة)
         ElcobyWheel.prize()  {code} لو فيه كود لسه ماتستخدمش، وإلا null                    */
(()=>{
'use strict';
const KEY='elcoby_wheel',SKEY='elcoby_wheel_dismissed';
const DELAY=6000;     /* بعد كام ملّي ثانية من فتح الصفحة تظهر العجلة */
const WINDOW=60000;   /* لو الشاشة مشغولة (مودال/سلة) بنحاول لحد المدة دي وبعدها نبطّل في الزيارة دي */
const SPIN_MS=5400;   /* مدة الدوران */
const OFFER=(typeof OFFER_MIN==='number'?OFFER_MIN:15)*60000;  /* صلاحية الكود بعد الفوز */
const deadline=s=>(s.w||s.t)+OFFER;

/* الشرائح بالترتيب مع عقارب الساعة بدءًا من الأعلى.  w = الوزن (الاحتمال النسبي للفوز) — دلوقتي متساوية */
const SL=[
  {code:'SAVE5',   w:1,l:['خصم 5%','5% off']},
  {code:'FREESHIP',w:1,l:['شحن مجاني','Free shipping']},
  {code:'SAVE10',  w:1,l:['خصم 10%','10% off']},
  {code:null,      w:1,l:['حظ سعيد المرة القادمة!','Better luck next time!']},
  {code:'OFF20',   w:1,l:['خصم 20 ج.م','EGP 20 off']},
  {code:'OFF50',   w:1,l:['خصم 50 ج.م','EGP 50 off']}
];
/* شروط الأكواد (t: pct | flat | ship ، min: أقل قيمة للطلب). بتتقرأ من CODES بتاعة المتجر لو موجودة */
const RULES=(typeof CODES==='object'&&CODES)||{SAVE5:{t:'pct',min:0},FREESHIP:{t:'ship',min:300},SAVE10:{t:'pct',min:400},OFF20:{t:'flat',min:250},OFF50:{t:'flat',min:600}};
const TX={
  ar:{title:'جرب حظك اليوم 🎁',sub:'احصل على كود خصم حصري لطلبك القادم',spin:'لف العجلة',spinning:'جارٍ التدوير…',copy:'نسخ الكود',copied:'تم النسخ ✓',manual:'انسخه يدويًا',close:'إغلاق',shop:'تسوّق الآن',yours:'مبروك! كسبت',thanks:'شكرًا لمشاركتك',expired:'انتهت صلاحية هذا الكود',valid:' · صالح لمدة {m} دقيقة'},
  en:{title:'Try your luck today 🎁',sub:'Win an exclusive discount code for your next order',spin:'Spin the wheel',spinning:'Spinning…',copy:'Copy code',copied:'Copied ✓',manual:'Copy manually',close:'Close',shop:'Shop now',yours:'Congratulations! You won',thanks:'Thanks for playing',expired:'This code has expired',valid:' · valid for {m} minutes'}
};
const PAL=[['#3b34b8','#5558e6'],['#1a2336','#2c3a54'],['#322e9a','#4b4fd6'],['#162033','#2a3850'],['#2b2788','#4144c4'],['#1c2639','#33415c']];

const q=s=>document.querySelector(s);
const wh=q('#wh'),card=q('#wh-card'),cv=q('#wh-cv'),ptr=q('.wh-ptr svg'),xBtn=q('#wh-x'),spinBtn=q('#wh-spin'),act=q('#wh-act'),res=q('#wh-res');
const per=360/SL.length;
let lang='ar',rot=0,hi=null,isOpen=false,spinning=false,lastFocus=null,mem=null,lastIdx=-1,rt;

const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}};
const state=()=>load()||mem;
const persist=o=>{mem=o;try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}};
const dismissed=()=>{try{return sessionStorage.getItem(SKEY)}catch(e){return null}};
const setDismissed=()=>{try{sessionStorage.setItem(SKEY,'1')}catch(e){}};
const lockBody=()=>{typeof lock==='function'?lock():document.body.style.overflow='hidden'};
const unlockBody=()=>{typeof unlock==='function'?unlock():document.body.style.overflow=''};
const finalAngle=i=>360-(i*per+per/2);               /* الزاوية اللي بتخلّي مركز الشريحة i تحت المؤشر */
const under=r=>Math.floor((((-r)%360+360)%360)/per);  /* أنهي شريحة تحت المؤشر عند زاوية r */

function terms(code){
  const r=RULES[code];if(!r)return'';const m=r.min||0;
  if(lang==='en')return r.t==='ship'?`Free shipping applies to orders of EGP ${m} or more`:m?`Discount applies to purchases of EGP ${m} or more`:'Discount applies to all purchases, no minimum';
  return r.t==='ship'?`يطبق الشحن المجاني على الطلبات بقيمة ${m} ج.م أو أكثر`:m?`يطبق الخصم على المشتريات بقيمة ${m} ج.م أو أكثر`:'يطبق الخصم على جميع المشتريات بدون حد أدنى';
}
function setTexts(){
  const t=TX[lang];
  q('#wh-title').textContent=t.title;q('#wh-sub').textContent=t.sub;
  spinBtn.textContent=t.spin;xBtn.setAttribute('aria-label',t.close);
  q('#wh-shop').textContent=t.shop;q('#wh-copy').textContent=t.copy;
}

/* ---------- الرسم (Canvas بدقة الشاشة) ---------- */
function wrap(g,txt,maxW){
  const out=[];let cur='';
  txt.split(' ').forEach(w=>{const t=cur?cur+' '+w:w;if(!cur||g.measureText(t).width<=maxW)cur=t;else{out.push(cur);cur=w}});
  if(cur)out.push(cur);return out;
}
function draw(){
  const S=cv.clientWidth||300,d=Math.min(window.devicePixelRatio||1,3);
  cv.width=cv.height=Math.round(S*d);
  const g=cv.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,S,S);
  const c=S/2,R0=c-2,rim=Math.max(8,S*.034),R=R0-rim,n=SL.length,a=Math.PI*2/n,ar=lang==='ar';
  /* الإطار الخارجي + نقاط الإضاءة */
  const rg=g.createLinearGradient(0,0,S,S);rg.addColorStop(0,'#475569');rg.addColorStop(.5,'#1e293b');rg.addColorStop(1,'#475569');
  g.beginPath();g.arc(c,c,R0,0,Math.PI*2);g.fillStyle=rg;g.fill();
  for(let i=0;i<n*4;i++){
    const t=-Math.PI/2+i*a/4,rr=R0-rim/2;
    g.beginPath();g.arc(c+Math.cos(t)*rr,c+Math.sin(t)*rr,Math.max(1.3,rim*.13),0,Math.PI*2);
    g.fillStyle=i%4===0?'rgba(199,210,254,.95)':'rgba(255,255,255,.3)';g.fill();
  }
  /* الشرائح */
  SL.forEach((s,i)=>{
    const a0=-Math.PI/2+i*a,a1=a0+a,p=PAL[i%PAL.length];
    const gr=g.createRadialGradient(c,c,R*.1,c,c,R);gr.addColorStop(0,p[0]);gr.addColorStop(1,p[1]);
    g.beginPath();g.moveTo(c,c);g.arc(c,c,R,a0,a1);g.closePath();
    g.fillStyle=gr;g.fill();g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=1.2;g.stroke();
    if(hi!==null&&hi!==i){g.fillStyle='rgba(2,6,23,.52)';g.fill()}   /* بعد الفوز: باقي الشرائح بتخفت */
    /* النص ماشي مع نصف القطر ونهايته عند الحافة */
    g.save();g.translate(c,c);g.rotate(a0+a/2);
    g.textBaseline='middle';g.textAlign='right';g.direction=ar?'rtl':'ltr';g.fillStyle='#f8fafc';
    const maxW=R*.6,xEnd=R-R*.085,txt=s.l[ar?0:1];
    let fs=R*.112,lines;
    for(;fs>9;fs-=.5){
      g.font=`700 ${fs}px Cairo,Poppins,system-ui,sans-serif`;lines=wrap(g,txt,maxW);
      if(lines.length<=2&&lines.every(t=>g.measureText(t).width<=maxW))break;
    }
    const lh=fs*1.2;lines.forEach((t,k)=>g.fillText(t,xEnd,(k-(lines.length-1)/2)*lh));
    g.restore();
  });
  g.beginPath();g.arc(c,c,R,0,Math.PI*2);g.strokeStyle='rgba(255,255,255,.2)';g.lineWidth=1.5;g.stroke();
}

/* ---------- الاختيار والدوران ---------- */
function pick(){
  const tot=SL.reduce((a,s)=>a+s.w,0);let r=Math.random()*tot;
  for(let i=0;i<SL.length;i++){r-=SL[i].w;if(r<0)return i}
  return SL.length-1;
}
function tick(){
  if(reduced())return;
  try{ptr.animate([{transform:'rotate(0deg)'},{transform:'rotate(-18deg)',offset:.4},{transform:'rotate(0deg)'}],{duration:130,easing:'ease-out'})}catch(e){}
}
function showResult(i){
  const s=SL[i],t=TX[lang];
  act.hidden=true;res.hidden=false;
  q('#wh-lbl').hidden=!s.code;q('#wh-lbl').textContent=t.yours;
  q('#wh-prize').textContent=s.l[lang==='ar'?0:1];
  q('#wh-codebox').hidden=!s.code;q('#wh-code').textContent=s.code||'';
  const st=state(),exp=!!(s.code&&st&&Date.now()>deadline(st));
  q('#wh-terms').textContent=s.code?(exp?t.expired:terms(s.code)+t.valid.replace('{m}',OFFER/60000)):t.thanks;
}
function spin(){
  if(spinning||state())return;
  const idx=pick(),s=SL[idx];
  persist({i:idx,code:s.code,t:Date.now(),used:0});    /* بنحفظ النتيجة قبل ما العجلة تلف — الريفرش مش بيدّي فرصة تانية */
  spinning=true;spinBtn.disabled=true;xBtn.disabled=true;spinBtn.textContent=TX[lang].spinning;card.focus({preventScroll:true});
  const cur=((rot%360)+360)%360;
  const need=((finalAngle(idx)-cur)%360+360)%360;
  const total=(5+Math.floor(Math.random()*2))*360+need;   /* 5 أو 6 لفّات كاملة + الباقي لحد مركز الشريحة */
  const from=rot,dur=reduced()?0:SPIN_MS+Math.random()*500,t0=performance.now();
  lastIdx=under(rot);
  const frame=now=>{
    const p=dur?Math.min(1,(now-t0)/dur):1,e=1-Math.pow(1-p,4);   /* ease-out quartic: سريعة في الأول وبتهدى تدريجيًا */
    rot=from+total*e;cv.style.transform=`rotate(${rot}deg)`;
    const k=under(rot);if(k!==lastIdx){lastIdx=k;tick()}
    if(p<1)requestAnimationFrame(frame);else done(idx);
  };
  requestAnimationFrame(frame);
}
function done(idx){
  spinning=false;hi=idx;
  const st=state();if(st){st.w=Date.now();persist(st)}   /* العدّاد بيبدأ من لحظة ظهور النتيجة */
  draw();showResult(idx);xBtn.disabled=false;
  if(SL[idx].code)document.dispatchEvent(new CustomEvent('elcoby:wheelwin',{detail:{code:SL[idx].code}}));
  (SL[idx].code?q('#wh-copy'):q('#wh-shop')).focus({preventScroll:true});
}

/* ---------- فتح / قفل ---------- */
function open(){
  if(isOpen)return;
  isOpen=true;lang=document.documentElement.lang==='en'?'en':'ar';setTexts();
  lastFocus=document.activeElement;wh.hidden=false;lockBody();
  const st=state();hi=st?st.i:null;rot=st?finalAngle(st.i):0;cv.style.transform=`rotate(${rot}deg)`;
  act.hidden=!!st;res.hidden=!st;spinBtn.disabled=false;xBtn.disabled=false;
  if(st)showResult(st.i);
  const go=()=>{draw();requestAnimationFrame(()=>{wh.classList.add('on');(st?(st.code?q('#wh-copy'):q('#wh-shop')):spinBtn).focus({preventScroll:true})})};
  document.fonts&&document.fonts.load?document.fonts.load('700 16px Cairo').then(go,go):go();
}
function close(){
  if(!isOpen||spinning)return;
  isOpen=false;wh.classList.remove('on');
  if(!state())setDismissed();                    /* قفلها من غير ما يلف: ماتظهرش تاني في نفس الزيارة */
  setTimeout(()=>{wh.hidden=true;unlockBody();lastFocus&&lastFocus.focus&&lastFocus.focus({preventScroll:true})},reduced()?0:300);
}

/* ---------- نسخ الكود ---------- */
function copyText(txt){
  const fallback=()=>{const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;top:0;opacity:0';document.body.append(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();return ok};
  if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(txt).then(()=>true,()=>fallback());
  return Promise.resolve(fallback());
}
q('#wh-copy').onclick=async()=>{
  const b=q('#wh-copy'),t=TX[lang],ok=await copyText(q('#wh-code').textContent);
  b.textContent=ok?t.copied:t.manual;
  if(!ok){const r=document.createRange();r.selectNodeContents(q('#wh-code'));const s=getSelection();s.removeAllRanges();s.addRange(r)}
  setTimeout(()=>{b.textContent=t.copy},2000);
};

/* ---------- الأحداث ---------- */
spinBtn.onclick=spin;
xBtn.onclick=close;
wh.addEventListener('click',e=>{if(e.target===wh)close()});
q('#wh-shop').onclick=()=>{close();const s=q('#shop');s&&setTimeout(()=>{typeof goToSection==='function'?goToSection('shop'):s.scrollIntoView({behavior:reduced()?'auto':'smooth'})},320)};
document.addEventListener('keydown',e=>{
  if(!isOpen)return;
  if(e.key==='Escape'){if(!spinning)close();return}
  if(e.key!=='Tab')return;
  const f=[...wh.querySelectorAll('button:not([disabled])')].filter(el=>el.offsetParent!==null);
  if(!f.length){e.preventDefault();return}
  const a=f[0],z=f[f.length-1];
  if(e.shiftKey&&(document.activeElement===a||document.activeElement===card)){e.preventDefault();z.focus()}
  else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
});
addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(isOpen)draw()},150)});

/* ---------- الظهور التلقائي (مرة واحدة بس لكل مستخدم) ---------- */
function schedule(){
  if(state()||dismissed())return;
  const t0=Date.now();
  const attempt=()=>{
    if(state()||isOpen||Date.now()-t0>DELAY+WINDOW)return;
    const busy=(typeof LOCK==='number'&&LOCK>0)||document.visibilityState!=='visible';
    busy?setTimeout(attempt,3000):open();
  };
  setTimeout(attempt,DELAY);
}

window.ElcobyWheel={
  open,close,
  reset(){try{localStorage.removeItem(KEY);sessionStorage.removeItem(SKEY)}catch(e){}mem=null},
  prize(){const s=state();return s&&s.code&&!s.used&&Date.now()<=deadline(s)?{code:s.code}:null},
  expired(code){const s=state();return !!(s&&s.code&&s.code===code&&Date.now()>deadline(s))},
  info(){const s=state();return s?Object.assign({},s,{deadline:deadline(s)}):null},
  markUsed(code){const s=state();if(s&&s.code===code&&!s.used){s.used=1;persist(s)}}
};
schedule();
})();
