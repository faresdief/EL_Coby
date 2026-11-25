import {api,P,byId,fmt,addToCart,lock,unlock} from './app.js';

/* ============ قارن منتجين جنب بعض: دوس على أيقونة المقارنة في أي كارت، اختار منتجين وافتح الجدول.
   بيستخدم نفس مكوّنات المتجر (النافذة، الأزرار، الألوان). الاختيار في الذاكرة بس. ============ */
const q=s=>document.querySelector(s),tray=q('#cmpTray'),M=q('#cmpM'),body=q('#cmpBody'),pv=q('#pv');
const isEn=()=>document.documentElement.lang==='en',l=()=>isEn()?1:0;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const X={
  go:['قارن','Compare'],clear:['مسح','Clear'],pick:['اختار منتج تاني للمقارنة','Pick one more product to compare'],
  title:['مقارنة المنتجات','Compare products'],price:['السعر','Price'],save:['توفير','You save'],cat:['القسم','Category'],mat:['الخامة','Material'],
  col:['الألوان','Colours'],siz:['المقاسات','Sizes'],best:['الأقل سعرًا','Lowest price'],add:['أضف للسلة','Add to cart'],view:['عرض المنتج','View product'],
  none:['مفيش','None'],rem:['شيل','Remove'],
  c:{w:['ساعة','Watch'],s:['نظارة شمسية','Sunglasses'],c:['سلسلة أو حظاظة','Chain or bracelet']}
};
const t=k=>X[k][l()];
const CMP=api.cmp;

function syncBtns(){
  document.querySelectorAll('[data-cmp]').forEach(b=>{const on=CMP.includes(b.dataset.cmp);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
}
function paintTray(){
  const show=CMP.length&&pv.hidden;tray.hidden=!show;if(!show)return;
  const ps=CMP.map(byId);
  tray.innerHTML=`<div class="cmp-th">${ps.map(p=>`<span class="cmp-t1"><img src="${p.img}" alt="${esc(p.n[l()])}" decoding="async" class="${p.fit?'ct':''}"></span>`).join('')}</div><span class="cmp-tx">${CMP.length<2?t('pick'):esc(ps[0].n[l()])+' / '+esc(ps[1].n[l()])}</span><button class="btn gold" id="cmpGo"${CMP.length<2?' disabled':''}>${t('go')}</button><button class="cmp-clr" id="cmpClr" aria-label="${t('clear')}"><svg class="i"><use href="#x"/></svg></button>`;
}
function paintModal(){
  if(M.hidden)return;
  const ps=CMP.map(byId).filter(Boolean),L=l();
  if(ps.length<2){closeM();return}
  const best=Math.min(...ps.map(p=>p.p));
  const row=(k,f)=>`<tr><th scope="row">${t(k)}</th>${ps.map(p=>`<td>${f(p)}</td>`).join('')}</tr>`;
  body.innerHTML=`<h2 id="cmpT" style="margin-bottom:16px">${t('title')}</h2>
  <div class="cmp-w"><table class="cmp-tb"><thead><tr><td></td>${ps.map(p=>`<td><div class="tile cmp-pic"><img src="${p.img}" alt="${esc(p.n[L])}" class="${p.fit?'ct':''}" decoding="async" onerror="this.style.opacity=0"></div><h3>${esc(p.n[L])}</h3></td>`).join('')}</tr></thead><tbody>
  ${row('price',p=>`<span class="price"><b>${fmt(p.p)}</b>${p.o?`<s>${fmt(p.o)}</s>`:''}</span>${ps.length>1&&p.p===best&&ps[0].p!==ps[1].p?`<span class="badge new cmp-bd">${t('best')}</span>`:''}`)}
  ${row('save',p=>p.o?fmt(p.o-p.p)+` <span class="badge">-${Math.round(100-p.p*100/p.o)}%</span>`:'-')}
  ${row('cat',p=>X.c[p.c][L])}
  ${row('mat',p=>esc(p.m[L]))}
  ${row('col',p=>p.colors?`<span class="sws cmp-sws">${p.colors.map(c=>`<i class="sw" style="--sw:${c.h}" title="${esc(c.n[L])}"></i>`).join('')}</span>`:esc(p.cl?p.cl[L]:t('none')))}
  ${row('siz',p=>p.sizes?p.sizes.map(z=>z[L]).join(' · '):t('none'))}
  <tr><th></th>${ps.map(p=>`<td><button class="btn gold" data-cadd="${p.id}">${t('add')}</button><button class="cmp-v" data-cview="${p.id}">${t('view')}</button></td>`).join('')}</tr>
  </tbody></table></div>`;
}
function openM(){if(CMP.length<2)return;M.hidden=false;lock();paintModal();M.querySelector('#cmpX').focus()}
function closeM(){if(M.hidden)return;M.hidden=true;unlock()}
function toggle(id){
  const i=CMP.indexOf(id);
  if(i>-1)CMP.splice(i,1);else{CMP.push(id);if(CMP.length>2)CMP.shift()}
  syncBtns();paintTray();
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.cmp!==undefined){toggle(b.dataset.cmp);return}
  if(b.id==='cmpGo'){openM();return}
  if(b.id==='cmpClr'){CMP.length=0;syncBtns();paintTray();return}
  if(b.id==='cmpX'){closeM();return}
  if(b.dataset.cadd){addToCart(b.dataset.cadd);return}
  if(b.dataset.cview){closeM();location.hash='#product/'+b.dataset.cview}
});
M.addEventListener('click',e=>{if(e.target===M)closeM()});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!M.hidden){e.stopImmediatePropagation();closeM()}},true);
addEventListener('hashchange',paintTray);
api.hooks.push(()=>{paintTray();paintModal()});
paintTray();
