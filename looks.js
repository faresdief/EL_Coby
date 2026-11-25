import {api,P,fmt,addToCart,goToSection,SET_TIERS} from './app.js';
import {calculateTotals,parseLook,lookLink} from './commerce.js';

/* ============ كمّل اللوك: اختار ساعة + نظارة + سلسلة أو حظاظة، والخصم بينزل لوحده.
   رابط الطقم: #look=id,id,id. بيستخدم نفس شكل المتجر، والإضافة للسلة بتعدّي على نفس حسابات السلة. ============ */
const q=s=>document.querySelector(s),root=q('#looks');
const isEn=()=>document.documentElement.lang==='en';
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const X={
  w:['الساعة','Watch'],s:['النظارة','Sunglasses'],c:['السلسلة أو الحظاظة','Chain or bracelet'],
  none:['لسه مختارتش','Not chosen yet'],
  sub:['إجمالي القطع','Items'],save:['خصم الطقم','Set discount'],tot:['الإجمالي','Total'],
  add:['أضف الطقم للسلة','Add the set to cart'],share:['انسخ رابط الطقم','Copy look link'],copied:['تم نسخ الرابط ✓','Link copied ✓'],
  hint2:['اختار قطعة تانية من قسم مختلف وخد خصم {p}%','Add a piece from another category for {p}% off'],
  hint3:['ضيف {c} وخد خصم {p}%','Add a {c} to unlock {p}% off'],
  done:['خصم الطقم {p}% متفعّل','Set discount {p}% applied'],
  cat:{w:['ساعة','watch'],s:['نظارة','pair of sunglasses'],c:['سلسلة أو حظاظة','chain or bracelet']}
};
const t=k=>X[k][isEn()?1:0];
const KEYS=['w','s','c'];
const sel={};
const set0=()=>KEYS.forEach(k=>{const f=P.find(p=>p.c===k&&!p.addon);if(f)sel[k]=f.id});

function nextTier(){
  const have=KEYS.filter(k=>sel[k]).length,miss=KEYS.filter(k=>!sel[k]);
  const pct=SET_TIERS[have+1];
  return {have,miss,pct};
}
function paint(){
  if(!root)return;
  const l=isEn()?1:0,chosen=KEYS.map(k=>sel[k]&&P.find(p=>p.id===sel[k])).filter(Boolean);
  const T=calculateTotals(chosen.map(p=>({p,q:1})),'',{},false,SET_TIERS);
  const n=nextTier(),pct=T.setPct;
  const hint=pct&&n.have===3?t('done').replace('{p}',pct):n.pct?(n.have>=2?t('hint3').replace('{c}',X.cat[n.miss[0]][l]):t('hint2')).replace('{p}',n.pct):(pct?t('done').replace('{p}',pct):t('hint2').replace('{p}',SET_TIERS[2]));
  root.innerHTML=`<div class="sec-h"><h2>${isEn()?'Complete the look':'كمّل اللوك'}</h2><p>${isEn()?'Pick a watch, sunglasses and a chain or bracelet. The set discount applies by itself.':'اختار ساعة ونظارة وسلسلة أو حظاظة، والخصم بينزل لوحده على الطقم.'}</p></div>
  <div class="lk">
    <div class="lk-c">${KEYS.map(k=>{const p=chosen.find(x=>x.c===k);return`<div class="tile lk-t">${p?`<img src="${p.img}" alt="${esc(p.n[l])}" class="${p.fit?'ct':''}" loading="lazy" decoding="async" onerror="this.style.opacity=0"><span class="lk-l">${esc(p.n[l])}</span>`:`<span class="lk-e">${t(k)}</span>`}</div>`}).join('')}</div>
    <div class="lk-p">
      ${KEYS.map(k=>`<div class="lk-r"><h4>${t(k)}</h4><div class="tabs">${P.filter(p=>p.c===k&&!p.addon).map(p=>`<button class="tab${sel[k]===p.id?' on':''}" data-lk="${p.id}" aria-pressed="${sel[k]===p.id}">${esc(p.n[l])} · ${fmt(p.p)}</button>`).join('')}</div></div>`).join('')}
      <p class="lk-h">${hint}</p>
      <div class="lk-s"><div class="tr"><span>${t('sub')}</span><b>${fmt(T.sub)}</b></div>${T.disc?`<div class="tr"><span>${t('save')} (${pct}%)</span><b>-${fmt(T.disc)}</b></div>`:''}<div class="tr tot"><span>${t('tot')}</span><span>${fmt(T.tot)}</span></div></div>
      <div class="lk-a"><button class="btn gold" id="lkAdd"${chosen.length?'':' disabled'}>${t('add')}</button><button class="btn" id="lkShare"${chosen.length?'':' disabled'}>${t('share')}</button></div>
    </div>
  </div>`;
}
root&&root.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.lk){const p=P.find(x=>x.id===b.dataset.lk);sel[p.c]=sel[p.c]===p.id?null:p.id;paint();return}
  if(b.id==='lkAdd'){KEYS.forEach(k=>sel[k]&&addToCart(sel[k]));return}
  if(b.id==='lkShare'){
    const u=location.href.split('#')[0]+'#look='+lookLink(sel);
    try{await navigator.clipboard.writeText(u);b.textContent=t('copied')}catch(_){location.hash='look='+lookLink(sel)}
    setTimeout(paint,1800);
  }
});
function fromHash(){
  const m=location.hash.match(/^#look=([\w,-]+)$/);if(!m)return;
  const got=parseLook(m[1],P);if(!Object.keys(got).length)return;
  KEYS.forEach(k=>{sel[k]=got[k]||null});paint();goToSection('looks');
}
set0();paint();api.hooks.push(paint);
addEventListener('hashchange',fromHash);fromHash();
