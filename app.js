import {D,GOV,CODES,OFFER_MIN,FREE,P,R,FAQ,WA} from './data.js';
import {normalizeCart,parseCartLine,countCart,discountAmount,hasFreeShippingCode,calculateTotals,variantKey,addCartItem,setCartQuantity} from './commerce.js';
const S=window.S;

const $=s=>document.querySelector(s),H=document.documentElement;
/* كل النصوص: [عربي, English] */
$('#waContact').href='https://wa.me/'+WA;

const byId=id=>P.find(p=>p.id===id);
let L=S.g('lang')=='en'?1:0,cat='all',QS='',cur=null,Q=1,gi=0,DISCCODE='',discBad=false,LOCK=0,SEL={c:0,s:0};
let CART=normalizeCart(S.g('cart'),P);S.s('cart',JSON.stringify(CART));
let WISH=new Set();try{WISH=new Set(JSON.parse(S.g('wish')||'[]').filter(byId))}catch(e){}
let USER=S.g('user')||null;
let QUICK=null,CO_SRC='cart';

const T=k=>D[k][L];
/* واجهة صغيرة للوحدات الجديدة (صفحة المنتج وغيرها) من غير ما نلمس باقي الكود */
const api={hooks:[],isWish:id=>WISH.has(id),toggleWish:id=>toggleWish(id),buyNow:(id,q,c,s)=>{QUICK={id,q,c,s};openCheckout('quick')},openCart:()=>openDrawer(),setCat:k=>{cat=k;renderTabs();renderGrid()}};
const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dc=p=>Math.round(100-p.p*100/p.o);
const fmt=v=>L?'EGP '+Math.round(v).toLocaleString('en-US'):Math.round(v).toLocaleString('ar-EG')+' ج.م';
const drawerOpen=()=>$('#cd').classList.contains('open');

/* ---------- السلة: المفتاح = id~لون~مقاس ---------- */
const vkey=variantKey;
const saveCart=()=>S.s('cart',JSON.stringify(CART));
const parseLine=k=>parseCartLine(k,CART[k],P);
const cartLines=()=>Object.keys(CART).map(parseLine).filter(Boolean);
const cartCount=()=>countCart(CART,P);
const vtext=l=>[l.p.colors&&l.p.colors[l.c==null?0:l.c]?l.p.colors[l.c==null?0:l.c].n[L]:'',l.p.sizes&&l.p.sizes[l.s==null?0:l.s]?l.p.sizes[l.s==null?0:l.s][L]:''].filter(Boolean).join(' · ');
const linesFor=src=>src=='cart'?cartLines():[{k:'quick',p:byId(QUICK.id),q:QUICK.q,c:QUICK.c,s:QUICK.s}];
const codeExpired=c=>{const w=window.ElcobyWheel;return !!(w&&c&&w.expired(c))}; /* كود العجلة خلصت مدته؟ */
const discAmt=sub=>discountAmount(sub,DISCCODE,CODES,codeExpired(DISCCODE));
const codeShip=sub=>hasFreeShippingCode(sub,DISCCODE,CODES,codeExpired(DISCCODE));
const prizeCode=()=>{const w=window.ElcobyWheel,p=w&&w.prize();return p?p.code:''}; /* كود العجلة اللي لسه ماتستخدمش */
const discNote=sub=>{ /* رسالة تحت خانة الكود: كود غلط أو الحد الأدنى مش متحقق */
  if(discBad)return T('badCode');
  if(DISCCODE&&codeExpired(DISCCODE))return T('expCode').replace('{m}',OFFER_MIN);
  const c=CODES[DISCCODE];return c&&sub<c.min?T('minCode').replace('{x}',fmt(c.min)):'';
};
function applyCode(raw){const v=raw.trim().toUpperCase();if(!v){DISCCODE='';discBad=false}else if(CODES[v]){DISCCODE=v;discBad=false}else{DISCCODE='';discBad=true}}
const totals=(ls,useDisc)=>calculateTotals(ls,useDisc?DISCCODE:'',CODES,codeExpired(DISCCODE));
const sset=u=>/images\.unsplash\.com.*[?&]w=900/.test(u||'')?` srcset="${u.replace('w=900','w=400')} 400w,${u.replace('w=900','w=600')} 600w,${u} 900w"`:'';
const thumb=p=>p.img?`<img src="${p.img}" alt="" loading="lazy" decoding="async" onerror="this.style.opacity=0">`:`<div class="ci-ico"><svg class="i"><use href="#${p.ico}"/></svg></div>`;

function lock(){LOCK++;document.body.style.overflow='hidden'}
function unlock(){LOCK=Math.max(0,LOCK-1);if(!LOCK)document.body.style.overflow=''}
function openModal(id){$(id).hidden=false;lock()}
function closeModal(id){$(id).hidden=true;unlock()}

/* ---------- إشعارات Toast ---------- */
function toast(msg,label,fn){
  const box=$('#toasts');
  while(box.children.length>=3)box.firstChild.remove();
  const el=document.createElement('div');el.className='ts';
  const sp=document.createElement('span');sp.textContent=msg;el.append(sp);
  let tm;
  const kill=()=>{clearTimeout(tm);el.classList.add('out');setTimeout(()=>el.remove(),260)};
  if(label){const b=document.createElement('button');b.className='ta';b.textContent=label;b.onclick=()=>{kill();fn()};el.append(b)}
  const x=document.createElement('button');x.className='tx';x.setAttribute('aria-label',T('close'));x.textContent='×';x.onclick=kill;el.append(x);
  box.append(el);tm=setTimeout(kill,3000);
}

/* ---------- العرض ---------- */
function renderTabs(){
  $('#tabs').innerHTML=['all','w','s','c'].map(k=>`<button class="tab${k==cat?' on':''}" data-c="${k}">${T(k)}</button>`).join('')+`<button class="tab${cat=='fav'?' on':''}" data-c="fav"><svg class="i"><use href="#h"/></svg>${T('favTab')} (${WISH.size})</button>`;
}
function renderGrid(){
  const list=P.filter(p=>!p.addon&&(cat=='all'||(cat=='fav'?WISH.has(p.id):p.c==cat))&&(!QS||p.n.some(x=>x.toLowerCase().includes(QS))));
  $('#grid').innerHTML=list.length?list.map(p=>`<article class="card"><div class="tile"><button class="pic" data-o="${p.id}" aria-label="${p.n[L]}"><img src="${p.img}"${sset(p.img)} sizes="(max-width:640px) 50vw, (max-width:1000px) 33vw, 25vw" alt="${p.n[L]}" class="${p.fit?'ct':''}" loading="lazy" decoding="async" onerror="this.style.opacity=0"></button>${p.o?`<span class="badge">-${dc(p)}%</span>`:p.b?`<span class="badge new">${T('new')}</span>`:''}<button class="fav${WISH.has(p.id)?' on':''}" data-f="${p.id}" aria-label="${T('wishAdd')}" aria-pressed="${WISH.has(p.id)}"><svg class="i"><use href="#h"/></svg></button><button class="qv" data-qv="${p.id}" aria-label="${T('qvBtn')}" title="${T('qvBtn')}"><svg class="i"><use href="#eye"/></svg></button><button class="add" data-add="${p.id}">${T('add')}</button></div><h3><button class="nm" data-o="${p.id}">${p.n[L]}</button></h3><p class="price"><b>${fmt(p.p)}</b>${p.o?`<s>${fmt(p.o)}</s>`:''}</p></article>`).join(''):`<p class="none">${T(cat=='fav'&&!QS?'favEmpty':'noRes')}</p>`;
}
function render(){
  H.lang=L?'en':'ar';H.dir=L?'ltr':'rtl';document.title=T('brand');
  document.querySelectorAll('[data-i]').forEach(e=>e.textContent=T(e.dataset.i));
  document.querySelectorAll('[data-al]').forEach(e=>e.setAttribute('aria-label',T(e.dataset.al)));
  $('.top').textContent=T('ship').replace('{x}',fmt(FREE));
  $('#q').placeholder=T('sr');$('#coDisc').placeholder=T('discCode');$('#em').placeholder=T('em');
  $('#lang').textContent=L?'عربي':'EN';
  $('#cnt').textContent=cartCount();
  syncWish(true);
  renderTabs();renderGrid();
  $('#revs').innerHTML=R.map(r=>`<div class="rev"><div class="stars">★★★★★</div><p>${r.t[L]}</p><small>${r.n[L]}</small></div>`).join('');
  $('#faqList').innerHTML=FAQ.map(([q,a],i)=>`<div class="faq-it" data-faq="${i}"><button class="faq-q">${T(q)}<svg class="i"><use href="#chev"/></svg></button><div class="faq-a"><div><p>${T(a)}</p></div></div></div>`).join('');
  {const gs=$('#gov').selectedIndex;$('#gov').innerHTML=GOV.map(g=>`<option>${g[L]}</option>`).join('');if(gs>-1)$('#gov').selectedIndex=gs}
  if($('#loginM').hidden===false)fillLogin();
  if(drawerOpen())renderCart();
  if(cur!=null)fillM();
  api.hooks.forEach(f=>f());
}

/* ---------- المفضلة ---------- */
function syncWish(skipGrid){
  S.s('wish',JSON.stringify([...WISH]));
  const n=WISH.size,wc=$('#wcnt');wc.textContent=n;wc.hidden=!n;
  document.querySelectorAll('[data-f]').forEach(b=>{const on=WISH.has(b.dataset.f);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  const wb=$('#wishToggle');if(wb){const on=WISH.has(cur);wb.classList.toggle('on',on);wb.setAttribute('aria-pressed',on);wb.lastChild.textContent=T(on?'wishIn':'wishAdd')}
  if(!skipGrid){renderTabs();if(cat=='fav')renderGrid()}
}
function toggleWish(id){WISH.has(id)?WISH.delete(id):WISH.add(id);syncWish()}

/* ---------- عرض تفاصيل المنتج ---------- */
const Z=['','transform:scale(1.9)','transform:scale(1.9);transform-origin:15% 85%'];
const baseImg=()=>{const p=byId(cur),c=p.colors&&p.colors[SEL.c];return c&&c.img||p.img};
const gal=()=>{const p=byId(cur),b=baseImg();return p.more?[b,...p.more].map(u=>[u,'']):p.z===0?[[b,'']]:Z.map(z=>[b,z])};
function fillGal(){
  const p=byId(cur),g=gal(),cl=p.fit?'ct':'';
  $('#mm').innerHTML=`<img src="${g[Math.min(gi,g.length-1)][0]}" class="${cl}" alt="${p.n[L]}" style="${g[Math.min(gi,g.length-1)][1]}" onerror="this.style.opacity=0">`;
  $('#th').innerHTML=g.length<2?'':g.map((x,k)=>`<button class="${k==gi?'on':''}" data-g="${k}" aria-label="${k+1}"><img class="${cl}" src="${x[0]}" alt="" style="${x[1]}"></button>`).join('');
}
const shareUrl=id=>location.href.split('#')[0]+'#product/'+id;
function fillM(){
  const p=byId(cur);fillGal();
  const colHtml=p.colors?`<div class="vr"><span class="vl">${T('selColor')}: <b id="colName">${p.colors[SEL.c].n[L]}</b></span><div class="sws">${p.colors.map((c,i)=>`<button class="sw${i==SEL.c?' on':''}" data-col="${i}" style="--sw:${c.h}" aria-label="${c.n[L]}" aria-pressed="${i==SEL.c}"></button>`).join('')}</div></div>`:'';
  const szHtml=p.sizes?`<div class="vr"><span class="vl">${T('selSize')}: <b id="szName">${p.sizes[SEL.s][L]}</b></span><div class="szs">${p.sizes.map((z,i)=>`<button class="sz${i==SEL.s?' on':''}" data-siz="${i}" aria-pressed="${i==SEL.s}">${z[L]}</button>`).join('')}</div></div>`:'';
  const on=WISH.has(p.id);
  $('#mi').innerHTML=`<h2 id="mt">${p.n[L]}</h2><div class="pr"><span>${fmt(p.p)}</span>${p.o?`<s>${fmt(p.o)}</s><span class="badge">-${dc(p)}%</span>`:''}</div>${p.o?`<p class="sv">${T('sv')} ${fmt(p.o-p.p)}</p>`:''}<p style="margin-top:10px">${T('ds_'+p.c)}</p>${colHtml}${szHtml}<ul class="sp"><li><span>${T('mat')}</span>${p.m[L]}</li>${p.colors?'':`<li><span>${T('colr')}</span>${p.cl[L]}</li>`}<li><span>${T('gul')}</span>${T('gu')}</li></ul><div class="qt"><span>${T('qty')}</span><div><button data-q="-1" aria-label="-">−</button><output>${Q}</output><button data-q="1" aria-label="+">+</button></div><b id="tt">${T('tot')}: ${fmt(p.p*Q)}</b></div><div class="act"><button class="btn" id="modalAdd">${T('add')}</button><button class="btn gold" id="modalBuy">${T('buy')}</button></div><p class="pay"><svg class="i"><use href="#cash"/></svg>${T('pay')}</p><div class="shr"><button class="chip${on?' on':''}" id="wishToggle" aria-pressed="${on}"><svg class="i"><use href="#h"/></svg><span>${T(on?'wishIn':'wishAdd')}</span></button><button class="chip" id="shareWa"><svg class="i"><use href="#wa"/></svg><span>${T('shareWa')}</span></button><button class="chip" id="shareCopy"><svg class="i"><use href="#copy"/></svg><span>${T('copyLink')}</span></button></div>`;
}
function selUpdate(){
  const p=byId(cur);
  document.querySelectorAll('#mi [data-col]').forEach(b=>{const on=+b.dataset.col==SEL.c;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  document.querySelectorAll('#mi [data-siz]').forEach(b=>{const on=+b.dataset.siz==SEL.s;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  if(p.colors)$('#colName').textContent=p.colors[SEL.c].n[L];
  if(p.sizes)$('#szName').textContent=p.sizes[SEL.s][L];
}
let lf;
/* صفحة المنتج الكاملة (product.js) بتحل محل النافذة القديمة. الرابط القديم #p=id لسه شغال */
function openM(id){
  if(!byId(id)||byId(id).addon)return;
  location.hash='#product/'+id;
}
function closeM(){
  cur=null;closeModal('#mo');lf&&lf.focus();
  try{history.replaceState(null,'',location.href.split('#')[0])}catch(e){}
}
$('#mx').onclick=closeM;
$('#mo').addEventListener('click',e=>{if(e.target.id=='mo')closeM()});
function hashOpen(){
  const m=location.hash.match(/^#p=([\w-]+)$/);
  if(!m||!byId(m[1])||byId(m[1]).addon)return;
  try{history.replaceState(null,'',location.href.split('#')[0]+'#product/'+m[1])}catch(e){}
  dispatchEvent(new HashChangeEvent('hashchange')); /* رابط قديم: حوّله لصفحة المنتج */
}
addEventListener('hashchange',hashOpen);

/* ---------- مشاركة ---------- */
function copyText(txt){
  const fallback=()=>{const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;opacity:0';document.body.append(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();return ok};
  if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(txt).then(()=>true,()=>fallback());
  return Promise.resolve(fallback());
}

/* ---------- السلة ---------- */
function addToCart(id,q=1,c=null,s=null){
  const p=byId(id);if(!p)return;
  if(p.colors&&c==null)c=0;if(p.sizes&&s==null)s=0;
  CART=addCartItem(CART,P,id,q,c,s);saveCart();
  $('#cnt').textContent=cartCount();
  if(drawerOpen())renderCart();
  else{const v=vtext({p,c,s});toast(T('toastAdded').replace('{n}',p.n[L]+(v?` (${v})`:'')),T('openCart'),openDrawer)}
}
function setQty(k,q){CART=setCartQuantity(CART,P,k,q);saveCart();$('#cnt').textContent=cartCount();renderCart()}
function renderCart(){
  const lines=cartLines(),{sub,disc,tot}=totals(lines,true);
  const xs=P.filter(p=>p.addon&&!lines.some(l=>l.p.id===p.id));
  $('#cdBody').innerHTML=lines.length?lines.map(l=>{const v=vtext(l);return`<div class="ci">${thumb(l.p)}<div class="ci-i"><h4>${l.p.n[L]}</h4>${v?`<p class="ci-v">${v}</p>`:''}<p class="ci-p">${fmt(l.p.p)}</p><div class="ci-q"><button data-cq="${l.k}" data-d="-1" aria-label="-">−</button><span>${l.q}</span><button data-cq="${l.k}" data-d="1" aria-label="+">+</button><button class="ci-rm" data-crm="${l.k}" aria-label="Remove"><svg class="i" style="width:17px;height:17px"><use href="#trash"/></svg></button></div></div></div>`}).join('')+(xs.length?`<div class="xs-w"><h5>${T('xsT')}</h5><div class="xs-g">${xs.map(p=>`<div class="xs"><div class="xs-i"><svg class="i"><use href="#${p.ico}"/></svg></div><b>${p.n[L]}</b><small>${p.d[L]}</small><span class="xs-p">${fmt(p.p)}</span><button class="xs-b" data-xadd="${p.id}">+ ${T('xsAdd')}</button></div>`).join('')}</div></div>`:''):`<div class="empty"><p>${T('emptyCart')}</p><button class="btn" data-goto="shop" style="margin-top:14px">${T('contShop')}</button></div>`;
  const note=discNote(sub),shipC=codeShip(sub);
  $('#cdFoot').innerHTML=lines.length?`<div class="disc"><input id="discInput" placeholder="${T('discCode')}" value="${esc(DISCCODE||prizeCode())}"><button id="discApply">${T('apply')}</button></div><p class="err" id="discErr"${note?'':' hidden'}>${note}</p><div class="tr"><span>${T('subtotal')}</span><b>${fmt(sub)}</b></div>${disc?`<div class="tr"><span>${T('discount')} (${DISCCODE})</span><b>-${fmt(disc)}</b></div>`:''}${shipC?`<div class="tr"><span>${T('shipFreeRow')} (${DISCCODE})</span><b>✓</b></div>`:''}<div class="tr tot"><span>${T('tot')}</span><span>${fmt(tot)}</span></div><button class="btn gold" id="ckBtn" style="width:100%">${T('checkout')}</button>`:'';
  const ship=$('#cdShip');ship.hidden=!lines.length;
  if(lines.length){
    const left=Math.max(0,FREE-tot),free=left<=0||shipC,ratio=free?1:tot/FREE;
    $('#shipTxt').textContent=free?T(left<=0?'shipDone':'shipCode'):T('shipLeft').replace('{x}',fmt(left));
    $('#shipBar').style.setProperty('--p',ratio);
    $('#shipBar').parentNode.setAttribute('aria-valuenow',Math.round(ratio*100));
    ship.classList.toggle('done',free);
  }
}
function openDrawer(){$('#bd').classList.add('open');$('#bd').setAttribute('aria-hidden','false');$('#cd').classList.add('open');lock();renderCart()}
function closeDrawer(){$('#cd').classList.remove('open');$('#bd').classList.remove('open');$('#bd').setAttribute('aria-hidden','true');unlock()}
$('#cartBtn').onclick=openDrawer;
$('#dx').onclick=closeDrawer;
$('#bd').addEventListener('click',closeDrawer);
$('#wishBtn').onclick=()=>{cat='fav';renderTabs();renderGrid();goToSection('shop')};

/* ---------- تسجيل الدخول ---------- */
function fillLogin(){
  $('#loginBody').innerHTML=`<h2>${T('login')}</h2><p class="mute-sm">${T('demoNote')}</p>${USER?`<p>${T('hi')} ${esc(USER)}</p>`:''}<div class="frm"><label for="afn">${T('fname')}</label><input id="afn" type="text" maxlength="80" autocomplete="off" value="${esc(USER||'')}"><button class="btn gold" id="asub">${T('saveProfile')}</button>${USER?`<button class="btn" id="logoutBtn">${T('logout')}</button>`:''}</div>`;
}
$('#acct').onclick=()=>{fillLogin();openModal('#loginM')};
$('#lx').onclick=()=>closeModal('#loginM');
$('#loginM').addEventListener('click',e=>{if(e.target.id=='loginM')closeModal('#loginM')});

/* ---------- الشيك آوت ---------- */
function fillCheckout(src){
  CO_SRC=src;
  const lines=linesFor(src),{sub,disc,tot}=totals(lines,true);
  $('#ordSummary').innerHTML=`<div class="ord">${lines.map(l=>{const v=vtext(l);return`<div><span>${l.p.n[L]}${v?` (${v})`:''} × ${l.q}</span><span>${fmt(l.p.p*l.q)}</span></div>`}).join('')}${disc?`<div><span>${T('discount')} (${DISCCODE})</span><span>-${fmt(disc)}</span></div>`:''}${codeShip(sub)?`<div><span>${T('shipFreeRow')} (${DISCCODE})</span><span>✓</span></div>`:''}<div style="font-weight:700;border-top:1px solid var(--line);margin-top:6px;padding-top:6px"><span>${T('tot')}</span><span>${fmt(tot)}</span></div></div>`;
  $('#coDisc').value=DISCCODE||prizeCode();
  const note=discNote(sub);$('#coDiscErr').hidden=!note;$('#coDiscErr').textContent=note;
  $('#coErr').hidden=true;
}
function openCheckout(src){fillCheckout(src);openModal('#checkoutM')}
$('#cox').onclick=()=>closeModal('#checkoutM');
$('#checkoutM').addEventListener('click',e=>{if(e.target.id=='checkoutM')closeModal('#checkoutM')});
$('#infoM').addEventListener('click',e=>{if(e.target.id=='infoM')closeModal('#infoM')});
$('#coSubmit').onclick=()=>{
  const name=$('#coName').value.trim(),phone=$('#coPhone').value.trim(),gov=$('#gov').value,addr=$('#coAddr').value.trim();
  if(!name||!phone||!addr){$('#coErr').hidden=false;$('#coErr').textContent=T('reqErr');return}
  const lines=linesFor(CO_SRC),{sub,disc,tot}=totals(lines,true);
  const used=(disc>0||codeShip(sub))?DISCCODE:'';
  const msg=[T('wam')+' — '+T('brand'),name,phone,gov,addr,'—',...lines.map(l=>{const v=vtext(l);return`${l.p.n[L]}${v?` (${v})`:''} × ${l.q} = ${fmt(l.p.p*l.q)}`}),disc?`${T('discount')}: -${fmt(disc)}`:'',used?`${T('codeLine')}: ${used}`:'',`${T('tot')}: ${fmt(tot)}`,(tot>=FREE||codeShip(sub))?T('shipFreeMsg'):''].filter(Boolean).join('\n');
  window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(msg),'_blank');
  closeModal('#checkoutM');
  // Opening a draft is not confirmation. Keep the cart and promo intact.
};

/* ---------- تنقّل الأقسام: سكرول ناعم + Class انيميشن بيتحط على القسم أول ما الزرار يتضغط ---------- */
const NAV_ITEMS='.sec-h,.tabs,.card,.rev,.faq-it,.hero-t,.hero-a';  /* عناصر القسم اللي بتتحرك ورا بعض */
let navRaf=0;
function navAnim(el,delay,soft){
  clearTimeout(el._navT);
  el.classList.remove('sec-anim','sec-soft');
  const items=el.querySelectorAll(NAV_ITEMS);
  items.forEach((n,i)=>n.style.setProperty('--i',Math.min(i,12)));
  el.style.setProperty('--sec-delay',delay+'ms');
  void el.offsetWidth;                              /* يعيد تشغيل الانيميشن لو اتضغط تاني */
  el.classList.add('sec-anim');if(soft)el.classList.add('sec-soft');
  el._navT=setTimeout(()=>{el.classList.remove('sec-anim','sec-soft');items.forEach(n=>n.style.removeProperty('--i'))},delay+Math.min(items.length,13)*70+1100);
}
function navScroll(y,dur){
  cancelAnimationFrame(navRaf);
  if(!dur){scrollTo(0,y);return}
  const y0=scrollY,dy=y-y0,t0=performance.now(),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const evs=['wheel','touchstart','keydown','mousedown'];
  const stop=()=>{cancelAnimationFrame(navRaf);evs.forEach(ev=>removeEventListener(ev,stop))};   /* المستخدم لمس الشاشة: نسيب السكرول ليه */
  evs.forEach(ev=>addEventListener(ev,stop,{passive:true}));
  const step=now=>{const p=Math.min(1,(now-t0)/dur);scrollTo(0,y0+dy*ease(p));if(p<1)navRaf=requestAnimationFrame(step);else stop()};
  navRaf=requestAnimationFrame(step);
}
function goToSection(id){
  const el=id?document.getElementById(id):$('main > section');   /* id فاضي = فوق (الهيرو) */
  if(!el)return false;
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const barH=parseFloat(getComputedStyle(H).getPropertyValue('--bar-h'))||0,hd=$('.hd');
  const off=barH+(hd?hd.offsetHeight:66)+14;                      /* تحت الهيدر (حتى لو لفّ على الموبايل) وشريط العدّاد */
  const r=el.getBoundingClientRect();
  const y=id?Math.max(0,Math.round(scrollY+r.top-off)):0,dist=Math.abs(y-scrollY);
  const seen=r.top<innerHeight*.6&&r.bottom>off+60;               /* القسم ظاهر قدامه أصلًا */
  const dur=reduce||dist<4?0:Math.round(Math.min(1100,Math.max(480,dist*.45)));
  navAnim(el,seen||!dur?0:Math.round(dur*.55),seen);              /* 1) الكلاس فورًا — والانيميشن يبدأ لما القسم يقرّب */
  navScroll(y,dur);                                               /* 2) سكرول ناعم من غير ما يغيّر الرابط */
  el.setAttribute('tabindex','-1');el.focus({preventScroll:true});/* 3) الفوكس للقسم عشان قارئ الشاشة والكيبورد */
  return true;
}
/* أي لينك داخلي (#shop / #faq / # للرئيسية) من القائمة أو الهيرو أو الفوتر */
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');
  if(!a||a.dataset.info!==undefined||a.target||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const h=a.getAttribute('href'),id=h==='#'?'':h.slice(1);
  if(id&&!document.getElementById(id))return;                     /* مش قسم عندنا (زي #p=...): سيبه للمتصفح */
  if(goToSection(id))e.preventDefault();
});

/* ---------- تفويض النقر العام ---------- */
document.addEventListener('click',e=>{
  const info=e.target.closest('a[data-info]');
  if(info){e.preventDefault();$('#infoT').textContent=T(info.dataset.info+'T');$('#infoB').textContent=T(info.dataset.info+'B');openModal('#infoM');return}
  const t=e.target.closest('button');if(!t)return;
  if(t.id=='ix'){closeModal('#infoM');return}
  if(t.classList.contains('faq-q')){t.closest('.faq-it').classList.toggle('open');return}
  if(t.dataset.c){cat=t.dataset.c;renderTabs();renderGrid();return}
  if(t.dataset.f!==undefined){toggleWish(t.dataset.f);return}
  if(t.dataset.add!==undefined){addToCart(t.dataset.add);return}
  if(t.dataset.o!==undefined){openM(t.dataset.o);return}
  if(t.dataset.g!==undefined){gi=+t.dataset.g;fillGal();return}
  if(t.dataset.col!==undefined){SEL.c=+t.dataset.col;gi=0;selUpdate();fillGal();return}
  if(t.dataset.siz!==undefined){SEL.s=+t.dataset.siz;selUpdate();return}
  if(t.dataset.q){Q=Math.max(1,Math.min(99,Q+ +t.dataset.q));$('#mi output').textContent=Q;$('#tt').textContent=T('tot')+': '+fmt(byId(cur).p*Q);return}
  if(t.id=='modalAdd'){const p=byId(cur);addToCart(cur,Q,p.colors?SEL.c:null,p.sizes?SEL.s:null);return}
  if(t.id=='modalBuy'){const p=byId(cur);QUICK={id:cur,q:Q,c:p.colors?SEL.c:null,s:p.sizes?SEL.s:null};closeM();openCheckout('quick');return}
  if(t.id=='wishToggle'){toggleWish(cur);return}
  if(t.id=='shareWa'){const p=byId(cur);open('https://wa.me/?text='+encodeURIComponent(p.n[L]+' — '+fmt(p.p)+'\n'+shareUrl(cur)),'_blank');return}
  if(t.id=='shareCopy'){const u=shareUrl(cur);copyText(u).then(ok=>{if(ok)toast(T('copied'));else prompt(T('copyManual'),u)});return}
  if(t.dataset.cq!==undefined){setQty(t.dataset.cq,(CART[t.dataset.cq]||0)+ +t.dataset.d);return}
  if(t.dataset.crm!==undefined){setQty(t.dataset.crm,0);return}
  if(t.dataset.xadd!==undefined){addToCart(t.dataset.xadd);return}
  if(t.id=='ckBtn'){closeDrawer();openCheckout('cart');return}
  if(t.dataset.goto){closeDrawer();goToSection(t.dataset.goto);return}
  if(t.id=='discApply'){applyCode($('#discInput').value);renderCart();return}
  if(t.id=='coDiscApply'){applyCode($('#coDisc').value);fillCheckout(CO_SRC);return}
  if(t.id=='asub'){USER=$('#afn').value.trim().slice(0,80)||null;S.s('user',USER||'');fillLogin();return}
  if(t.id=='logoutBtn'){USER=null;S.s('user','');fillLogin();return}
});
document.addEventListener('keydown',e=>{if(e.key!='Enter')return;if(e.target.id=='discInput'){e.preventDefault();$('#discApply').click()}else if(e.target.id=='coDisc'){e.preventDefault();$('#coDiscApply').click()}});
$('#q').addEventListener('input',e=>{QS=e.target.value.trim().toLowerCase();if(QS&&cat=='fav')cat='all';renderTabs();renderGrid()});
$('#q').addEventListener('keydown',e=>{if(e.key=='Enter'){e.preventDefault();e.target.blur();goToSection('shop')}});
$('#lang').onclick=()=>{L=1-L;S.s('lang',L?'en':'ar');render()};
function setTheme(t){
  const f=$('#fade');
  f.style.willChange='opacity';f.style.transition='none';
  f.style.background=getComputedStyle(H).getPropertyValue('--bg').trim();
  f.style.opacity='1';
  void f.offsetHeight; /* يجبر المتصفح يثبّت القفزة الفورية قبل ما نبدّل الثيم تحتها */
  H.dataset.theme=t;S.s('theme',t);
  requestAnimationFrame(()=>{
    f.style.transition='opacity .3s ease';
    requestAnimationFrame(()=>{f.style.opacity='0';setTimeout(()=>{f.style.willChange='auto'},320)});
  });
}
$('#theme').onclick=()=>setTheme(H.dataset.theme=='dark'?'light':'dark');
document.addEventListener('keydown',e=>{
  if(e.key!='Escape')return;
  if(!$('#infoM').hidden)closeModal('#infoM');
  else if(!$('#checkoutM').hidden)closeModal('#checkoutM');
  else if(!$('#loginM').hidden)closeModal('#loginM');
  else if(cur!=null)closeM();
  else if(drawerOpen())closeDrawer();
});
render();
hashOpen();

export {api,P,byId,fmt,addToCart,openM,WA,FREE,CODES,OFFER_MIN,DISCCODE,discAmt,codeShip,lock,unlock,LOCK,goToSection};
