import {api,P,byId,fmt,addToCart,WA,FREE} from './app.js';
import {gallerySlides,relatedProducts} from './commerce.js';

/* ============ صفحة المنتج: صور متعددة، ألوان، مقاسات، دليل مقاسات، منتجات مشابهة ============
   الرابط: #product/<id>. الرابط القديم #p=<id> بيتحوّل تلقائيًا. بتشتغل جنب المتجر من غير ما تغيّر شكله. */
const q=s=>document.querySelector(s),root=q('#pv'),main=q('main');
const isEn=()=>document.documentElement.lang==='en';
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const X={
  home:['الرئيسية','Home'],back:['رجوع للمتجر','Back to shop'],
  w:['ساعات','Watches'],s:['نظارات شمسية','Sunglasses'],c:['سلاسل وحظاظات','Chains & Bracelets'],
  color:['اللون','Colour'],size:['المقاس','Size'],qty:['الكمية','Quantity'],tot:['الإجمالي','Total'],save:['وفّرت','You save'],
  add:['أضف للسلة','Add to cart'],buy:['اشترِ الآن','Buy now'],wishAdd:['أضف للمفضلة','Add to wishlist'],wishIn:['في المفضلة','In wishlist'],
  shareWa:['مشاركة واتساب','Share on WhatsApp'],copyLink:['نسخ الرابط','Copy link'],copied:['تم نسخ الرابط ✓','Link copied ✓'],
  desc:{w:['ساعة بتصميم شبابي عصري تناسب الاستخدام اليومي، مريحة في اللبس وأنيقة مع أي إطلالة.','A modern, youthful watch for everyday wear. Comfortable and easy to pair with any look.'],
        s:['نظارة شمسية بتصميم عصري تكمّل إطلالتك وتريّح عينيك في الشمس.','Modern sunglasses that complete your look and keep your eyes comfortable in the sun.'],
        c:['قطعة استانلس ستيل بتصميم شبابي، تلبسها كل يوم وتنسّقها بسهولة.','A youthful stainless steel piece. Wear it every day and style it with ease.']},
  mat:['الخامة','Material'],colr:['اللون / الستايل','Colour / style'],gul:['الضمان','Guarantee'],gu:['ضمان 6 أشهر ضد الصدأ وتغيّر اللون','6-month warranty against rust & colour fading'],
  one:['مقاس واحد','One size'],sizeLbl:['المقاس','Size'],
  pay:['الدفع عند الاستلام أو تحويل InstaPay، وتقدر تعاين المنتج قبل ما تستلمه.','Cash on delivery or InstaPay transfer, and you can inspect the product before accepting it.'],
  gT:['كيف أعرف مقاسي؟','How do I find my size?'],
  g:{
    w:['قس محيط رسغك بشريط قياس. أقل من 16 سم: مقاس 38 مم. من 16 إلى 18 سم: مقاس 40 مم. أكتر من 18 سم: مقاس 42 مم.','Measure your wrist with a tape. Under 16 cm: 38 mm. 16 to 18 cm: 40 mm. Over 18 cm: 42 mm.'],
    s:['النظارة بمقاس واحد مناسب لمعظم الوجوه.','The sunglasses come in one size that suits most faces.'],
    c:['السلسلة: 45 سم قريبة من الرقبة، 50 سم المقاس المعتاد، 55 سم أطول وتنزل على الصدر. الحظاظة: قس رسغك وزوّد 2 سم للراحة (18 سم لرسغ نحيف، 20 سم متوسط، 22 سم أكبر).','Chain: 45 cm sits close to the neck, 50 cm is the usual length, 55 cm hangs longer. Bracelet: measure your wrist and add 2 cm for comfort (18 cm slim, 20 cm medium, 22 cm larger).']
  },
  dT:['تفاصيل المنتج','Product details'],shT:['التوصيل والدفع','Delivery & payment'],rtT:['الاستبدال والاسترجاع','Returns & exchange'],
  sh:['التوصيل لكل المحافظات من يومين لخمس أيام عمل حسب المحافظة. الدفع عند الاستلام أو InstaPay قبل الشحن. شحن مجاني للطلبات فوق {x}.','Delivery to every governorate in 2 to 5 business days depending on the governorate. Cash on delivery, or InstaPay before shipping. Free delivery on orders over {x}.'],
  rt:['استبدال أو استرجاع خلال 14 يوم من الاستلام لو القطعة بحالتها الأصلية ومعاها العلبة.','Exchange or return within 14 days of receiving the item if it is in its original condition with the box.'],
  rel:['منتجات مشابهة','You may also like'],
  v1:['معاينة المنتج قبل الدفع','Inspect before you pay'],v2:['ضمان 6 أشهر','6-month warranty'],v3:['طلب سريع عبر واتساب','Quick ordering on WhatsApp'],
  zoom:['تكبير الصورة','Zoom image'],prev:['السابق','Previous'],next:['التالي','Next']
};
const t=k=>X[k][isEn()?1:0];
let cur=null,SEL={c:0,s:0},Q=1,gi=0,homeY=0,zoom=false,oldTitle='';
const L=()=>isEn()?1:0;

/* ---------- العرض ---------- */
function gallery(p){
  const g=gallerySlides(p,SEL.c),i=Math.min(gi,g.length-1),ct=p.fit?'ct':'';
  const nav=g.length>1?`<button class="pv-nav prev" type="button" data-pn="-1" aria-label="${t('prev')}"><svg class="i"><use href="#chev"/></svg></button><button class="pv-nav next" type="button" data-pn="1" aria-label="${t('next')}"><svg class="i"><use href="#chev"/></svg></button><div class="pv-dots">${g.map((_,k)=>`<i class="${k==i?'on':''}"></i>`).join('')}</div>`:'';
  const th=g.length>1?`<div class="th pv-th">${g.map((x,k)=>`<button type="button" class="${k==i?'on':''}" data-pg="${k}" aria-label="${k+1}"><img class="${ct}" src="${esc(x[0])}" alt="" style="${x[1]}" loading="lazy" decoding="async"></button>`).join('')}</div>`:'';
  return `<div class="pv-main mm" id="pvMain" role="group" aria-label="${esc(p.n[L()])}"><img class="${ct}" id="pvImg" src="${esc(g[i][0])}" alt="${esc(p.n[L()])}" style="${g[i][1]}" decoding="async" fetchpriority="high" draggable="false" onerror="this.style.opacity=0">${nav}<button class="pv-zm" type="button" id="pvZoom" aria-label="${t('zoom')}"><svg class="i"><use href="#s"/></svg></button></div>${th}`;
}
function info(p){
  const l=L(),on=api.isWish(p.id);
  const colHtml=p.colors?`<div class="vr"><span class="vl">${t('color')}: <b id="pvColName">${esc(p.colors[SEL.c].n[l])}</b></span><div class="sws">${p.colors.map((c,i)=>`<button class="sw${i==SEL.c?' on':''}" data-pc="${i}" style="--sw:${esc(c.h)}" aria-label="${esc(c.n[l])}" aria-pressed="${i==SEL.c}"></button>`).join('')}</div></div>`:'';
  const szHtml=p.sizes?`<div class="vr"><span class="vl">${t('size')}: <b id="pvSzName">${esc(p.sizes[SEL.s][l])}</b></span><div class="szs">${p.sizes.map((z,i)=>`<button class="sz${i==SEL.s?' on':''}" data-ps="${i}" aria-pressed="${i==SEL.s}">${esc(z[l])}</button>`).join('')}</div></div>`:'';
  const acc=(k,title,body)=>`<div class="faq-it" data-pva><button class="faq-q" type="button">${title}<svg class="i"><use href="#chev"/></svg></button><div class="faq-a"><div><p>${body}</p></div></div></div>`;
  return `<h1 class="pv-t">${esc(p.n[l])}</h1>
<div class="pr"><span>${fmt(p.p)}</span>${p.o?`<s>${fmt(p.o)}</s><span class="badge">-${Math.round(100-p.p*100/p.o)}%</span>`:p.b?`<span class="badge new">${isEn()?'New':'جديد'}</span>`:''}</div>
${p.o?`<p class="sv">${t('save')} ${fmt(p.o-p.p)}</p>`:''}
<p class="pv-d">${X.desc[p.c][l]}</p>${colHtml}${szHtml}
<ul class="sp"><li><span>${t('mat')}</span>${esc(p.m[l])}</li>${p.colors?'':`<li><span>${t('colr')}</span>${esc(p.cl[l])}</li>`}${p.sizes?'':`<li><span>${t('sizeLbl')}</span>${t('one')}</li>`}<li><span>${t('gul')}</span>${t('gu')}</li></ul>
<div class="qt"><span>${t('qty')}</span><div><button type="button" data-pq="-1" aria-label="-">−</button><output id="pvQ">${Q}</output><button type="button" data-pq="1" aria-label="+">+</button></div><b id="pvTot">${t('tot')}: ${fmt(p.p*Q)}</b></div>
<div class="act"><button class="btn" type="button" id="pvAdd">${t('add')}</button><button class="btn gold" type="button" id="pvBuy">${t('buy')}</button></div>
<p class="pay"><svg class="i"><use href="#cash"/></svg>${t('pay')}</p>
<div class="shr"><button class="chip${on?' on':''}" type="button" id="pvWish" aria-pressed="${on}"><svg class="i"><use href="#h"/></svg><span>${t(on?'wishIn':'wishAdd')}</span></button><button class="chip" type="button" id="pvShareWa"><svg class="i"><use href="#wa"/></svg><span>${t('shareWa')}</span></button><button class="chip" type="button" id="pvCopy"><svg class="i"><use href="#copy"/></svg><span>${t('copyLink')}</span></button></div>
<div class="pv-acc faq">${acc('g',t('gT'),esc(X.g[p.c][l]))}${acc('d',t('dT'),esc(X.desc[p.c][l])+' '+esc(t('mat'))+': '+esc(p.m[l])+'. '+esc(t('gu'))+'.')}${acc('s',t('shT'),esc(t('sh').replace('{x}',fmt(FREE))))}${acc('r',t('rtT'),esc(t('rt')))}</div>`;
}
function related(p){
  const l=L(),list=relatedProducts(P,p.id,4);
  if(!list.length)return '';
  return `<section class="pv-rel"><div class="sec-h"><h2>${t('rel')}</h2></div><div class="grid">${list.map(r=>`<article class="card"><div class="tile"><button class="pic" data-o="${r.id}" aria-label="${esc(r.n[l])}"><img src="${r.img}" alt="${esc(r.n[l])}" class="${r.fit?'ct':''}" decoding="async" onerror="this.style.opacity=0"></button>${r.o?`<span class="badge">-${Math.round(100-r.p*100/r.o)}%</span>`:r.b?`<span class="badge new">${isEn()?'New':'جديد'}</span>`:''}</div><h3><button class="nm" data-o="${r.id}">${esc(r.n[l])}</button></h3><p class="price"><b>${fmt(r.p)}</b>${r.o?`<s>${fmt(r.o)}</s>`:''}</p></article>`).join('')}</div></section>`;
}
function ld(p){
  let s=q('#pv-ld');if(!s){s=document.createElement('script');s.type='application/ld+json';s.id='pv-ld';document.head.append(s)}
  s.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Product',name:p.n[0],image:[p.img],description:X.desc[p.c][0],brand:{'@type':'Brand',name:'الكوبي'},offers:{'@type':'Offer',priceCurrency:'EGP',price:String(p.p),url:location.href}});
}
function paint(){
  const p=byId(cur);if(!p)return;
  const l=L(),cat=t(p.c);
  root.innerHTML=`<nav class="pv-bc" aria-label="breadcrumb"><a href="#">${t('home')}</a><span aria-hidden="true">›</span><a href="#shop" data-pcat="${p.c}">${cat}</a><span aria-hidden="true">›</span><span>${esc(p.n[l])}</span></nav>
<div class="pv-g"><div class="pv-gal">${gallery(p)}</div><div class="pv-info mi">${info(p)}</div></div>${related(p)}
<div class="pv-bar" id="pvBar"><div><b id="pvBarP">${fmt(p.p*Q)}</b>${p.o?`<s>${fmt(p.o*Q)}</s>`:''}</div><button class="btn gold" type="button" id="pvAdd2">${t('add')}</button></div>`;
  document.title=p.n[l]+' | '+(isEn()?'ElCoby':'الكوبي');
  ld(p);
}
function paintGal(){const p=byId(cur);if(!p)return;q('.pv-gal').innerHTML=gallery(p);zoom=false}
function paintVars(){
  const p=byId(cur),l=L();
  document.querySelectorAll('#pv [data-pc]').forEach(b=>{const on=+b.dataset.pc==SEL.c;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  document.querySelectorAll('#pv [data-ps]').forEach(b=>{const on=+b.dataset.ps==SEL.s;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  if(p.colors)q('#pvColName').textContent=p.colors[SEL.c].n[l];
  if(p.sizes)q('#pvSzName').textContent=p.sizes[SEL.s][l];
}
function paintQ(){const p=byId(cur);q('#pvQ').textContent=Q;q('#pvTot').textContent=t('tot')+': '+fmt(p.p*Q);q('#pvBarP').textContent=fmt(p.p*Q)}

/* ---------- التنقّل ---------- */
function show(id){
  const first=cur==null;
  if(first){homeY=scrollY;oldTitle=document.title}
  if(cur!==id){cur=id;SEL={c:0,s:0};Q=1;gi=0;zoom=false}
  main.hidden=true;root.hidden=false;document.body.classList.add('pv-on');
  paint();scrollTo(0,0);
}
function hide(restore){
  if(cur==null)return;
  cur=null;root.hidden=true;root.innerHTML='';main.hidden=false;document.body.classList.remove('pv-on');
  const s=q('#pv-ld');if(s)s.remove();
  document.title=oldTitle||document.title;
  if(restore)scrollTo(0,homeY);
}
function route(){
  const m=location.hash.match(/^#product\/([\w-]+)$/),p=m&&byId(m[1]);
  if(p&&!p.addon)show(m[1]);else hide(true);
}
addEventListener('hashchange',route);
api.hooks.push(()=>{if(cur!=null)paint()});
/* أي لينك داخلي أو زرار هيدر وإحنا في صفحة المنتج: ارجع للمتجر الأول وبعدين كمّل */
function leave(){
  if(cur==null)return;
  hide(false);
  try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
}
document.addEventListener('click',e=>{
  if(cur==null)return;
  const a=e.target.closest('a[href^="#"]');
  if(a&&!a.getAttribute('href').startsWith('#product/')&&a.dataset.info===undefined){
    const cat=a.dataset.pcat;if(cat)api.setCat(cat);
    leave();return;
  }
  if(e.target.closest('#wishBtn'))leave();
},true);

/* ---------- الأحداث ---------- */
function slideTo(n){
  const p=byId(cur),g=gallerySlides(p,SEL.c);if(g.length<2)return;
  gi=(n+g.length)%g.length;paintGal();
}
root.addEventListener('click',e=>{
  const p=cur&&byId(cur);if(!p)return;
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.pc!==undefined){SEL.c=+b.dataset.pc;gi=0;paintVars();paintGal();return}
  if(b.dataset.ps!==undefined){SEL.s=+b.dataset.ps;paintVars();return}
  if(b.dataset.pg!==undefined){slideTo(+b.dataset.pg);return}
  if(b.dataset.pn!==undefined){slideTo(gi+ +b.dataset.pn);return}
  if(b.dataset.pq){Q=Math.max(1,Math.min(99,Q+ +b.dataset.pq));paintQ();return}
  if(b.id=='pvZoom'||(e.target.id=='pvImg')){zoom=!zoom;q('#pvMain').classList.toggle('zoomed',zoom);if(!zoom)q('#pvImg').style.transformOrigin='';return}
  if(b.id=='pvAdd'||b.id=='pvAdd2'){addToCart(cur,Q,p.colors?SEL.c:null,p.sizes?SEL.s:null);return}
  if(b.id=='pvBuy'){api.buyNow(cur,Q,p.colors?SEL.c:null,p.sizes?SEL.s:null);return}
  if(b.id=='pvWish'){api.toggleWish(cur);const on=api.isWish(cur);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);b.lastChild.textContent=t(on?'wishIn':'wishAdd');return}
  if(b.id=='pvShareWa'){open('https://wa.me/?text='+encodeURIComponent(p.n[L()]+' — '+fmt(p.p)+'\n'+location.href.split('#')[0]+'#product/'+cur),'_blank');return}
  if(b.id=='pvCopy'){const u=location.href.split('#')[0]+'#product/'+cur,done=()=>{b.lastChild.textContent=t('copied');setTimeout(()=>{b.lastChild.textContent=t('copyLink')},1800)};
    (navigator.clipboard&&isSecureContext?navigator.clipboard.writeText(u).then(()=>true,()=>false):Promise.resolve(false)).then(ok=>{if(ok)done();else prompt(t('copyLink'),u)});return}
  if(b.classList.contains('faq-q')){b.closest('.faq-it').classList.toggle('open')}
});
/* تكبير بتتبّع المؤشر وسحب للتبديل بين الصور */
let sx=null;
root.addEventListener('pointermove',e=>{
  if(!zoom||e.target.id!=='pvImg')return;
  const r=e.target.getBoundingClientRect();e.target.style.transformOrigin=((e.clientX-r.left)/r.width*100)+'% '+((e.clientY-r.top)/r.height*100)+'%';
});
root.addEventListener('pointerdown',e=>{if(e.target.closest('#pvMain')&&!zoom&&!e.target.closest('button'))sx=e.clientX});
root.addEventListener('pointerup',e=>{
  if(sx==null)return;const dx=e.clientX-sx;sx=null;
  if(Math.abs(dx)<45)return;
  const rtl=document.documentElement.dir==='rtl';slideTo(gi+((dx<0)!==rtl?1:-1));
});
document.addEventListener('keydown',e=>{
  if(cur==null||e.target.closest('input,textarea,select'))return;
  if(e.key==='ArrowRight')slideTo(gi+(document.documentElement.dir==='rtl'?-1:1));
  if(e.key==='ArrowLeft')slideTo(gi+(document.documentElement.dir==='rtl'?1:-1));
});
route();
