import {P,byId,fmt,addToCart,openM,WA,FREE,CODES,DISCCODE,discAmt,codeShip,lock,unlock} from './app.js';

/* MICRO-INTERACTIONS */
/* ============ JS — Fly-to-cart · Quick View · Countdown bar ============
   بيعتمد على جلوبالز المتجر: P, byId, fmt, addToCart, openM, WA, FREE, CODES, DISCCODE, discAmt, codeShip, lock/unlock
   وعلى ElcobyWheel (للعدّاد). كل حاجة جوا IIFE لوحدها وبدون أي مكتبات. */
(()=>{
'use strict';
const q=s=>document.querySelector(s);
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const isEn=()=>document.documentElement.lang==='en';
const rtl=()=>document.documentElement.dir==='rtl';
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MX={
  add:['أضف للسلة','Add to cart'],wa:['طلب سريع عبر واتساب','Quick order on WhatsApp'],full:['عرض التفاصيل الكاملة','View full details'],
  color:['اللون','Colour'],size:['المقاس','Size'],close:['إغلاق','Close'],prev:['السابق','Previous'],next:['التالي','Next'],save:['وفّرت','You save'],
  brand:['الكوبي','ElCoby'],waTitle:['طلب سريع','Quick order'],tot:['الإجمالي','Total'],disc:['الخصم','Discount'],code:['كود الخصم','Promo code'],freeShip:['الشحن: مجاني ✓','Shipping: free ✓'],
  desc:{w:['ساعة بتصميم شبابي عصري تناسب الاستخدام اليومي.','A modern, youthful watch for everyday wear.'],s:['نظارة شمسية بتصميم عصري تكمّل إطلالتك.','Modern sunglasses that complete your look.'],c:['قطعة استانلس ستيل بتصميم شبابي، تلبسها كل يوم.','A youthful stainless steel piece for everyday wear.']},
  copy:['نسخ الكود','Copy code'],copied:['تم النسخ ✓','Copied ✓'],expires:['ينتهي خلال','Expires in'],gone:['انتهت مدة عرضك','Your offer has expired'],
  off:['خصم','off'],pct:['خصم {v}%','{v}% off'],flat:['خصم {v} ج.م','EGP {v} off'],ship:['شحن مجاني','Free shipping'],codeWord:['الكود','Code']
};
const t=k=>MX[k][isEn()?1:0];

/* ---------- نسخ نص (Clipboard + fallback) ---------- */
function copyText(txt){
  const fb=()=>{const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;top:0;opacity:0';document.body.append(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();return ok};
  if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(txt).then(()=>true,()=>fb());
  return Promise.resolve(fb());
}

/* =====================================================================
   1) Fly-to-cart — الصورة بتطير في مسار قوسي (Bezier تربيعي) لأيقونة السلة + Pulse عند الوصول
   ===================================================================== */
function pulse(){
  const b=q('#cartBtn');if(!b||!b.animate)return;
  b.animate([{transform:'scale(1)'},{transform:'scale(1.3) rotate(-10deg)',offset:.3},{transform:'scale(.92) rotate(6deg)',offset:.6},{transform:'scale(1)'}],{duration:520,easing:'ease-out'});
  const c=q('#cnt');if(c)c.animate([{transform:'scale(1)'},{transform:'scale(1.5)'},{transform:'scale(1)'}],{duration:380,easing:'ease-out'});
  const r=b.getBoundingClientRect(),ring=document.createElement('div');
  ring.className='mi-ring';ring.style.left=(r.left+r.width/2)+'px';ring.style.top=(r.top+r.height/2)+'px';document.body.append(ring);
  const a=ring.animate([{transform:'scale(.7)',opacity:.9},{transform:'scale(2.3)',opacity:0}],{duration:560,easing:'ease-out'});
  a.onfinish=a.oncancel=()=>ring.remove();
}
function fly(src,url){
  if(reduced()||!src)return;
  const btn=q('#cartBtn');if(!btn)return;
  const a=src.getBoundingClientRect(),b=btn.getBoundingClientRect();
  if(!a.width||!b.width)return;
  const size=Math.round(Math.min(76,Math.max(46,a.width*.3)));
  const sx=a.left+a.width/2,sy=a.top+a.height/2;
  const tx=b.left+b.width/2-sx,ty=b.top+b.height/2-sy;           /* الإزاحة من المركز للمركز */
  /* نقطة التحكم = منتصف الخط + إزاحة عمودية عليه → قوس واضح حتى لو السلة فوق المنتج مباشرة */
  const len=Math.hypot(tx,ty)||1,h=Math.max(70,Math.min(180,len*.3)),nx=-ty/len,ny=tx/len;
  const W=innerWidth,mx=tx/2,my=ty/2;
  const ctrl=k=>({x:mx+k*h*nx,y:my+k*h*ny});
  let k=Math.abs(ny)>.2?(ny<0?1:-1):(sx+ctrl(1).x>W/2?-1:1);      /* الجنب الأعلى، أو ناحية منتصف الشاشة لو الخط رأسي */
  const cp=ctrl(k);
  const cx=Math.max(8-sx,Math.min(W-8-sx,cp.x)),cy=Math.max(8-sy,cp.y); /* ما يخرجش بره الشاشة */
  const el=document.createElement('div');el.className='mi-fly';
  el.style.cssText=`width:${size}px;height:${size}px;left:${sx-size/2}px;top:${sy-size/2}px`+(url?`;background-image:url("${String(url).replace(/"/g,'%22')}")`:'');
  document.body.append(el);
  if(!el.animate){el.remove();pulse();return}
  const N=26,kf=[];
  for(let i=0;i<=N;i++){
    const p=i/N,e=.5-.5*Math.cos(Math.PI*p),u=1-e;                /* ease-in-out ناعم */
    const x=2*u*e*cx+e*e*tx,y=2*u*e*cy+e*e*ty;
    kf.push({transform:`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${(1-.72*e).toFixed(3)}) rotate(${(-14*e).toFixed(1)}deg)`,opacity:p<.8?1:1-(p-.8)/.2*.9});
  }
  const an=el.animate(kf,{duration:850,easing:'linear',fill:'forwards'});
  an.onfinish=()=>{el.remove();pulse()};
  an.oncancel=()=>el.remove();
}
document.addEventListener('click',e=>{
  const add=e.target.closest('.add[data-add]');
  if(add){const card=add.closest('.card'),img=card&&card.querySelector('.pic img');fly(img||(card&&card.querySelector('.tile')),img&&(img.currentSrc||img.src));return}
  if(e.target.closest('#modalAdd')){const m=q('#mm'),img=m&&m.querySelector('img');fly(m,img&&img.src)}
});

/* =====================================================================
   2) Quick View — معاينة سريعة (معرض صور + لون/مقاس + إضافة للسلة + طلب واتساب)
   ===================================================================== */
const qvEl=q('#qv'),qvCard=q('#qv-card'),qvMain=q('#qv-main'),qvTh=q('#qv-th'),qvInfo=q('#qv-info'),qvX=q('#qv-x');
const QZ=['','transform:scale(1.9)','transform:scale(1.9);transform-origin:15% 85%'];  /* لو المنتج صورة واحدة: تكبيرات مختلفة منها */
let qid=null,sel={c:0,s:0},idx=0,qOpen=false,lastF=null,sx0=null;
const ix=()=>isEn()?1:0;
const lockB=()=>{typeof lock==='function'?lock():document.body.style.overflow='hidden'};
const unlockB=()=>{typeof unlock==='function'?unlock():document.body.style.overflow=''};
const prod=()=>byId(qid);
function slides(){const p=prod(),c=p.colors&&p.colors[sel.c],base=(c&&c.img)||p.img;return p.more?[base,...p.more].map(u=>[u,'']):QZ.map(z=>[base,z])}
function renderGal(){
  const p=prod(),sl=slides(),n=sl.length;idx=Math.min(idx,n-1);
  qvMain.innerHTML=sl.map((s,i)=>`<img class="qv-sl${i===idx?' on':''}" src="${esc(s[0])}" alt="${esc(p.n[ix()])}" style="${s[1]}" draggable="false" onerror="this.style.opacity=0">`).join('')
    +(n>1?`<button class="qv-nav prev" type="button" data-qn="-1" aria-label="${t('prev')}"><svg class="i"><use href="#chev"/></svg></button><button class="qv-nav next" type="button" data-qn="1" aria-label="${t('next')}"><svg class="i"><use href="#chev"/></svg></button><div class="qv-dots">${sl.map((_,i)=>`<i class="${i===idx?'on':''}"></i>`).join('')}</div>`:'');
  qvTh.innerHTML=n>1?sl.map((s,i)=>`<button class="qv-t${i===idx?' on':''}" type="button" data-qg="${i}" aria-label="${i+1}"><img src="${esc(s[0])}" alt="" style="${s[1]}" onerror="this.style.opacity=0"></button>`).join(''):'';
}
function go(i){
  const n=qvMain.querySelectorAll('.qv-sl').length;if(!n)return;
  idx=((i%n)+n)%n;
  qvMain.querySelectorAll('.qv-sl').forEach((e,k)=>e.classList.toggle('on',k===idx));
  qvMain.querySelectorAll('.qv-dots i').forEach((e,k)=>e.classList.toggle('on',k===idx));
  qvTh.querySelectorAll('.qv-t').forEach((e,k)=>e.classList.toggle('on',k===idx));
}
function renderInfo(focusSel){
  const p=prod(),L=ix();
  const col=p.colors?`<div class="qv-vr"><span class="qv-vl">${t('color')}: <b>${esc(p.colors[sel.c].n[L])}</b></span><div class="qv-sws">${p.colors.map((c,i)=>`<button class="qv-sw${i===sel.c?' on':''}" type="button" data-qc="${i}" style="--sw:${esc(c.h)}" aria-label="${esc(c.n[L])}" aria-pressed="${i===sel.c}"></button>`).join('')}</div></div>`:'';
  const siz=p.sizes?`<div class="qv-vr"><span class="qv-vl">${t('size')}: <b>${esc(p.sizes[sel.s][L])}</b></span><div class="qv-szs">${p.sizes.map((z,i)=>`<button class="qv-sz${i===sel.s?' on':''}" type="button" data-qs="${i}" aria-pressed="${i===sel.s}">${esc(z[L])}</button>`).join('')}</div></div>`:'';
  qvInfo.innerHTML=`<h3 id="qv-title">${esc(p.n[L])}</h3><div class="qv-pr"><span>${fmt(p.p)}</span>${p.o?`<s>${fmt(p.o)}</s><span class="qv-off">-${Math.round(100-p.p*100/p.o)}%</span>`:''}</div>${p.o?`<p class="qv-sv">${t('save')} ${fmt(p.o-p.p)}</p>`:''}<p class="qv-ds">${MX.desc[p.c][L]}</p>${col}${siz}<div class="qv-act"><button class="qv-btn" type="button" id="qv-add">${t('add')}</button><button class="qv-btn ghost" type="button" id="qv-wa"><svg class="i"><use href="#wa"/></svg>${t('wa')}</button></div><a class="qv-link" href="#" id="qv-full">${t('full')}</a>`;
  if(focusSel){const f=qvInfo.querySelector(focusSel);f&&f.focus({preventScroll:true})}
}
function openQV(id){
  const p=byId(id);if(!p||p.addon||qOpen)return;
  qid=id;sel={c:0,s:0};idx=0;qOpen=true;lastF=document.activeElement;
  qvX.setAttribute('aria-label',t('close'));
  renderGal();renderInfo();qvEl.hidden=false;lockB();
  requestAnimationFrame(()=>{qvEl.classList.add('on');qvX.focus({preventScroll:true})});
}
function closeQV(noFocus){
  if(!qOpen)return;
  qOpen=false;qvEl.classList.remove('on');
  setTimeout(()=>{qvEl.hidden=true;unlockB();if(!noFocus&&lastF&&lastF.focus)lastF.focus({preventScroll:true})},reduced()?0:300);
}
function quickWa(){
  const p=prod(),L=ix();
  const v=[p.colors?p.colors[sel.c].n[L]:'',p.sizes?p.sizes[sel.s][L]:''].filter(Boolean).join(' · ');
  const sub=p.p,disc=discAmt(sub),ship=codeShip(sub),used=(disc>0||ship)?DISCCODE:'',tot=sub-disc;
  const msg=[t('waTitle')+' — '+t('brand'),`${p.n[L]}${v?` (${v})`:''} × 1 = ${fmt(sub)}`,disc?`${t('disc')}: -${fmt(disc)}`:'',used?`${t('code')}: ${used}`:'',`${t('tot')}: ${fmt(tot)}`,(tot>=FREE||ship)?t('freeShip'):''].filter(Boolean).join('\n');
  window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(msg),'_blank');
  // A WhatsApp draft does not confirm an order or consume a promo.
}
/* أحداث النافذة */
qvEl.addEventListener('click',e=>{
  if(e.target===qvEl){closeQV();return}
  const a=e.target.closest('#qv-full');if(a){e.preventDefault();const id=qid;closeQV(true);setTimeout(()=>openM(id),0);return}
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='qv-x'){closeQV();return}
  if(b.dataset.qn){go(idx+ +b.dataset.qn);return}
  if(b.dataset.qg!==undefined){go(+b.dataset.qg);return}
  if(b.dataset.qc!==undefined){sel.c=+b.dataset.qc;const c=prod().colors[sel.c];if(c&&c.img){idx=0;renderGal()}renderInfo('[data-qc="'+sel.c+'"]');return}
  if(b.dataset.qs!==undefined){sel.s=+b.dataset.qs;renderInfo('[data-qs="'+sel.s+'"]');return}
  if(b.id==='qv-add'){const p=prod(),on=qvMain.querySelector('.qv-sl.on');addToCart(qid,1,p.colors?sel.c:null,p.sizes?sel.s:null);fly(qvMain,on&&on.src);return}
  if(b.id==='qv-wa'){quickWa();return}
});
/* سحب بالإصبع / الماوس بين الصور */
qvMain.addEventListener('pointerdown',e=>{sx0=e.clientX});
qvMain.addEventListener('pointerup',e=>{if(sx0==null)return;const dx=e.clientX-sx0;sx0=null;if(Math.abs(dx)>40)go(idx+(dx<0?1:-1)*(rtl()?-1:1))});
qvMain.addEventListener('pointercancel',()=>{sx0=null});
/* زرار المعاينة على الكارت */
document.addEventListener('click',e=>{const b=e.target.closest('.qv[data-qv]');if(b)openQV(b.dataset.qv)});
/* كيبورد: Esc / أسهم / Tab محبوس جوا النافذة */
document.addEventListener('keydown',e=>{
  if(!qOpen)return;
  if(e.key==='Escape'){closeQV();return}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){go(idx+(e.key==='ArrowRight'?1:-1)*(rtl()?-1:1));return}
  if(e.key!=='Tab')return;
  const f=[...qvEl.querySelectorAll('button:not([disabled]),a[href]')].filter(el=>el.offsetParent!==null);
  if(!f.length)return;
  const a=f[0],z=f[f.length-1];
  if(e.shiftKey&&(document.activeElement===a||document.activeElement===qvCard)){e.preventDefault();z.focus()}
  else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
});

/* =====================================================================
   3) Countdown bar — شريط علوي ثابت بعد الفوز بكود من العجلة (وقت حقيقي: الكود بينتهي مع العدّاد)
   ===================================================================== */
const bar=q('#mi-bar'),clock=q('#mi-clock'),msg=q('#mi-msg'),cpy=q('#mi-copy'),CK='elcoby_bar_closed';
let tm=null,goneTm=null;
const wInfo=()=>window.ElcobyWheel&&ElcobyWheel.info&&ElcobyWheel.info();
const getClosed=()=>{try{return sessionStorage.getItem(CK)}catch(e){return null}};
const setClosed=v=>{try{v?sessionStorage.setItem(CK,'1'):sessionStorage.removeItem(CK)}catch(e){}};
const clockTxt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function prizeLabel(code){
  const c=(typeof CODES==='object'&&CODES[code])||null;if(!c)return code;
  return c.t==='pct'?t('pct').replace('{v}',c.v):c.t==='flat'?t('flat').replace('{v}',c.v):t('ship');
}
function setBarH(){document.documentElement.style.setProperty('--bar-h',(bar.classList.contains('on')?bar.offsetHeight:0)+'px')}
if(window.ResizeObserver)new ResizeObserver(setBarH).observe(bar);
addEventListener('resize',setBarH);
function barText(){
  const i=wInfo();if(!i||!i.code)return;
  cpy.textContent=t('copy');q('#mi-x').setAttribute('aria-label',t('close'));
  if(bar.classList.contains('gone')){msg.textContent=t('gone');return}
  msg.innerHTML=`<span aria-hidden="true">🎁</span> ${esc(prizeLabel(i.code))} · ${t('codeWord')} <b>${esc(i.code)}</b> · ${t('expires')}`;
}
function barShow(){
  const i=wInfo();if(!i||!i.code||i.used||Date.now()>=i.deadline)return;
  clearTimeout(goneTm);bar.classList.remove('gone');barText();tick();
  bar.classList.add('on');bar.setAttribute('aria-hidden','false');setBarH();
  clearInterval(tm);tm=setInterval(tick,1000);
}
function barHide(){
  clearInterval(tm);clearTimeout(goneTm);
  bar.classList.remove('on');bar.setAttribute('aria-hidden','true');setBarH();
  setTimeout(setBarH,350);
}
function tick(){
  const i=wInfo();
  if(!i||!i.code||i.used){barHide();return}
  const left=i.deadline-Date.now();
  if(left<=0){clearInterval(tm);bar.classList.add('gone');clock.classList.remove('low');barText();goneTm=setTimeout(barHide,5000);return}
  clock.textContent=clockTxt(left);clock.classList.toggle('low',left<60000);
}
cpy.addEventListener('click',async()=>{
  const i=wInfo();if(!i)return;
  const ok=await copyText(i.code);cpy.textContent=ok?t('copied'):t('copy');
  setTimeout(()=>{cpy.textContent=t('copy')},1600);
});
q('#mi-x').addEventListener('click',()=>{setClosed(true);barHide()});
document.addEventListener('elcoby:wheelwin',()=>{setClosed(false);barShow()});
document.addEventListener('visibilitychange',()=>{if(bar.classList.contains('on'))tick()});
new MutationObserver(barText).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
if(!getClosed())barShow();   /* رجع للصفحة والعرض لسه شغال */
window.MicroInteractions={fly,openQuickView:openQV,closeQuickView:closeQV};
})();
