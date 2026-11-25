(function(){
var $=function(i){return document.getElementById(i)};
var data,cart={},cat='';
try{cart=JSON.parse(localStorage.getItem('coby_cart')||'{}')||{}}catch(e){cart={}}
function money(n){return n.toLocaleString('ar-EG')+' '+data.shop.currency}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function watch(p){
  var c=p.color,d='#0f0f12',g;
  var I={
  buds:'<rect x="55" y="95" width="90" height="60" rx="26" fill="'+c+'"/><circle cx="82" cy="60" r="14" fill="'+c+'"/><rect x="76" y="62" width="12" height="38" rx="6" fill="'+c+'"/><circle cx="118" cy="60" r="14" fill="'+c+'"/><rect x="112" y="62" width="12" height="38" rx="6" fill="'+c+'"/><line x1="55" y1="115" x2="145" y2="115" stroke="#0006" stroke-width="2"/>',
  headphones:'<path d="M50 120V100a50 50 0 0 1 100 0v20" fill="none" stroke="'+c+'" stroke-width="10"/><rect x="40" y="110" width="26" height="46" rx="12" fill="'+c+'"/><rect x="134" y="110" width="26" height="46" rx="12" fill="'+c+'"/>',
  watch:'<rect x="80" y="20" width="40" height="160" rx="8" fill="'+c+'"/><rect x="62" y="64" width="76" height="72" rx="18" fill="#333"/><rect x="68" y="70" width="64" height="60" rx="13" fill="#05080f"/><path d="M82 100h14l6-14 8 28 6-14h8" fill="none" stroke="#c9a24a" stroke-width="3"/>',
  charger:'<rect x="65" y="55" width="70" height="90" rx="12" fill="'+c+'"/><rect x="82" y="35" width="8" height="22" fill="#999"/><rect x="110" y="35" width="8" height="22" fill="#999"/><rect x="88" y="115" width="24" height="10" rx="4" fill="#666"/>',
  bank:'<rect x="60" y="45" width="80" height="110" rx="14" fill="'+c+'"/><rect x="72" y="62" width="56" height="8" rx="4" fill="#c9a24a"/><rect x="72" y="80" width="34" height="6" rx="3" fill="#888"/>',
  cable:'<path d="M40 150c40 0 20-100 60-100s20 100 60 100" fill="none" stroke="'+c+'" stroke-width="8" stroke-linecap="round"/><rect x="28" y="142" width="18" height="16" rx="3" fill="#ccc"/><rect x="154" y="142" width="18" height="16" rx="3" fill="#ccc"/>',
  stand:'<rect x="70" y="35" width="60" height="100" rx="10" fill="#222"/><rect x="76" y="42" width="48" height="86" rx="6" fill="#05080f"/><rect x="92" y="135" width="16" height="30" fill="'+c+'"/><rect x="60" y="162" width="80" height="12" rx="6" fill="'+c+'"/>'};
  return '<svg viewBox="0 0 200 200" role="img" aria-label="'+esc(p.name)+'"><rect width="200" height="200" fill="'+d+'"/>'+(I[p.icon]||I.buds)+'<text x="100" y="192" text-anchor="middle" font-size="9" fill="#a29d92">صورة توضيحية</text></svg>'
}
function find(id){return data.products.filter(function(p){return p.id===id})[0]}
function save(){try{localStorage.setItem('coby_cart',JSON.stringify(cart))}catch(e){}}
function render(){
  var q=$('q').value.trim().toLowerCase(),s=$('sort').value;
  var list=data.products.filter(function(p){return(!cat||p.category===cat)&&(!q||(p.name+' '+(p.desc||'')).toLowerCase().indexOf(q)>-1)});
  if(s)list.sort(function(a,b){return s==='asc'?a.price-b.price:b.price-a.price});
  $('empty').hidden=list.length>0;
  $('grid').innerHTML=list.map(function(p){return '<article class="card">'+watch(p)+'<div class="cb"><h3>'+esc(p.name)+'</h3><p>'+esc(p.desc||'')+'</p><div class="price">'+money(p.price)+'</div><button class="add" data-id="'+esc(p.id)+'">أضف للسلة</button></div></article>'}).join('')
}
function renderCart(){
  var ids=Object.keys(cart).filter(function(i){return find(i)&&cart[i]>0}),sum=0,n=0;
  ids.forEach(function(i){sum+=find(i).price*cart[i];n+=cart[i]});
  $('count').textContent=n.toLocaleString('ar-EG');
  $('total').textContent=money(sum);
  $('items').innerHTML=ids.length?ids.map(function(i){var p=find(i);return '<div class="it"><span>'+esc(p.name)+'<br><small>'+money(p.price)+'</small></span><div class="qty"><button data-d="-1" data-id="'+esc(i)+'" aria-label="إنقاص">-</button><b>'+cart[i]+'</b><button data-d="1" data-id="'+esc(i)+'" aria-label="زيادة">+</button></div></div>'}).join(''):'<p class="empty">السلة فاضية.</p>';
  var w=$('wa');
  if(!ids.length){w.setAttribute('aria-disabled','true');w.removeAttribute('href');return}
  w.removeAttribute('aria-disabled');
  var nm=$('cname').value.trim();
  var msg='السلام عليكم، حابب أطلب من '+data.shop.name+':\n'+ids.map(function(i){var p=find(i);return '- '+p.name+' × '+cart[i]+' = '+money(p.price*cart[i])}).join('\n')+'\nالإجمالي: '+money(sum)+(nm?'\nالاسم: '+nm:'');
  w.href='https://wa.me/'+data.shop.whatsapp+'?text='+encodeURIComponent(msg)
}
function openC(o){$('drawer').classList.toggle('open',o);$('drawer').setAttribute('aria-hidden',!o);$('shade').hidden=!o;if(o)$('closeCart').focus();else $('openCart').focus()}
function change(id,d){cart[id]=Math.max(0,Math.min(20,(cart[id]||0)+d));if(!cart[id])delete cart[id];save();renderCart()}
fetch('products.json').then(function(r){return r.json()}).then(function(d){
  data=d;$('brand').textContent=d.shop.name;$('tagline').textContent=d.shop.tagline||'';
  if(d.shop.sample){$('sampleBar').hidden=false;$('sampleBar').textContent=d.shop.sampleNote;$('footNote').textContent=d.shop.sampleNote}
  var c=[{id:'',name:'الكل'}].concat(d.categories);
  $('chips').innerHTML=c.map(function(x){return '<button class="chip" data-c="'+esc(x.id)+'" aria-pressed="'+(x.id===''?'true':'false')+'">'+esc(x.name)+'</button>'}).join('');
  render();renderCart()
}).catch(function(){$('grid').innerHTML='<p class="empty">تعذر تحميل المنتجات.</p>'});
$('chips').addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;cat=b.dataset.c;[].forEach.call($('chips').children,function(x){x.setAttribute('aria-pressed',x===b)});render()});
$('grid').addEventListener('click',function(e){var b=e.target.closest('.add');if(b){change(b.dataset.id,1);openC(true)}});
$('items').addEventListener('click',function(e){var b=e.target.closest('button[data-d]');if(b)change(b.dataset.id,+b.dataset.d)});
$('q').addEventListener('input',render);$('sort').addEventListener('change',render);$('cname').addEventListener('input',renderCart);
$('openCart').onclick=function(){openC(true)};$('closeCart').onclick=function(){openC(false)};$('shade').onclick=function(){openC(false)};
document.addEventListener('keydown',function(e){if(e.key==='Escape')openC(false)});
$('logo').onclick=function(e){e.preventDefault();window.scrollTo(0,0)};
})();
