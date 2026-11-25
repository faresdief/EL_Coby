import {api,P,byId,fmt,addToCart} from './app.js';

/* ============ المتجر يفتكر العميل: الاسم والموبايل بيتحفظوا على جهازه بس (localStorage)، ومفيش أي حاجة بتتبعت لأي حد.
   وزرار "اطلب تاني" بيرجّع آخر طلب للسلة. ============ */
const S=window.S,q=s=>document.querySelector(s);
const isEn=()=>document.documentElement.lang==='en',l=()=>isEn()?1:0;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const X={
  note:['محفوظ على جهازك بس.','Saved on this device only.'],forget:['انسَ بياناتي','Forget my details'],
  again:['اطلب تاني','Order again'],last:['آخر طلب ليك','Your last order'],addAll:['أضف آخر طلب للسلة','Add last order to cart'],
  added:['رجّعنا آخر طلب للسلة','Last order added to your cart'],gone:['تم مسح بياناتك من الجهاز','Your details were removed from this device'],
  hi:['أهلًا','Welcome back']
};
const t=k=>X[k][l()];
const load=k=>{try{return JSON.parse(S.g(k)||'null')}catch(e){return null}};
const cust=()=>{const c=load('cust');return c&&typeof c==='object'?{name:String(c.name||'').slice(0,80),phone:String(c.phone||'').slice(0,20)}:null};
const lastOrder=()=>{
  const o=load('lastOrder');if(!Array.isArray(o))return [];
  return o.map(r=>Array.isArray(r)?r:[]).filter(r=>byId(r[0])&&!byId(r[0]).addon&&Number.isInteger(r[1])&&r[1]>0&&r[1]<=99);
};
function note(){
  const n=q('#custNote');if(!n)return;
  const c=cust();n.hidden=!c;
  n.innerHTML=c?`${t('note')} <button type="button" class="cust-f" id="custForget">${t('forget')}</button>`:'';
}
api.prefill=()=>{
  const c=cust();
  if(c){const a=q('#coName'),b=q('#coPhone');if(a&&!a.value)a.value=c.name;if(b&&!b.value)b.value=c.phone}
  note();
};
api.onOrder=(lines,name,phone)=>{
  S.s('cust',JSON.stringify({name:name.slice(0,80),phone:phone.slice(0,20)}));
  S.s('lastOrder',JSON.stringify(lines.filter(x=>!x.p.addon).map(x=>[x.p.id,x.q,x.c==null?null:x.c,x.s==null?null:x.s])));
};
api.cartExtra=()=>{
  const o=lastOrder();if(!o.length)return '';
  const L=l(),names=o.map(r=>`${esc(byId(r[0]).n[L])}${r[1]>1?' ×'+r[1]:''}`).join('، ').replace(/،/g,L?',':'،');
  return `<div class="xs-w"><h5>${t('last')}</h5><p class="mute-sm">${names}</p><button class="btn" data-reorder="1" style="margin-top:8px">${t('again')}</button></div>`;
};
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.reorder){lastOrder().forEach(r=>addToCart(r[0],r[1],r[2],r[3]));return}
  if(b.id==='custForget'){S.s('cust','');S.s('lastOrder','');q('#coName').value='';q('#coPhone').value='';note();return}
});
