// Pure cart and pricing rules. Browser storage and UI stay outside this module.
export const variantKey=(id,c,s)=>`${id}~${c==null?'':c}~${s==null?'':s}`;
const validQuantity=q=>Number.isSafeInteger(q)&&q>0&&q<=99;
function variant(raw,options){
  if(!options)return raw==null||raw===''?null:undefined;
  if(raw==null||raw==='')return 0;
  if(!/^\d+$/.test(String(raw)))return undefined;
  const n=Number(raw);return n<options.length?n:undefined;
}
export function parseCartLine(key,q,products){
  if(typeof key!=='string'||!validQuantity(q))return null;
  const parts=key.split('~');if(parts.length>3)return null;
  const [id,c,s]=parts;
  const p=/^\d+$/.test(id)?products[Number(id)]:products.find(p=>p.id===id);
  if(!p)return null;
  const color=variant(c,p.colors),size=variant(s,p.sizes);
  if(color===undefined||size===undefined)return null;
  return {k:variantKey(p.id,color,size),p,q,c:color,s:size};
}
export function normalizeCart(input,products){
  let raw=input;
  if(typeof raw==='string'){try{raw=JSON.parse(raw)}catch{return {}}}
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
  const result={};
  for(const [key,q] of Object.entries(raw)){
    const line=parseCartLine(key,q,products);if(!line)continue;
    result[line.k]=Math.min(99,(result[line.k]||0)+line.q);
  }
  return result;
}
export const countCart=(cart,products)=>Object.values(normalizeCart(cart,products)).reduce((a,b)=>a+b,0);
export function addCartItem(cart,products,id,q=1,c=null,s=null){
  const next=normalizeCart(cart,products),line=parseCartLine(variantKey(id,c,s),q,products);
  if(line)next[line.k]=Math.min(99,(next[line.k]||0)+q);
  return next;
}
export function setCartQuantity(cart,products,key,q){
  const next=normalizeCart(cart,products);
  const line=parseCartLine(key,1,products);if(!line||!Number.isSafeInteger(q))return next;
  if(q<=0)delete next[line.k];else next[line.k]=Math.min(99,q);
  return next;
}
export function discountAmount(sub,code,codes,expired=false){
  const rule=Object.hasOwn(codes,code)?codes[code]:null;
  if(!rule||expired||sub<rule.min)return 0;
  return rule.t==='pct'?Math.round(sub*rule.v/100):rule.t==='flat'?Math.min(rule.v,sub):0;
}
export function hasFreeShippingCode(sub,code,codes,expired=false){
  const rule=Object.hasOwn(codes,code)?codes[code]:null;
  return !!rule&&rule.t==='ship'&&!expired&&sub>=rule.min;
}
export function calculateTotals(lines,code='',codes={},expired=false){
  const sub=lines.reduce((sum,line)=>validQuantity(line.q)&&Number.isFinite(line.p?.p)&&line.p.p>=0?sum+line.p.p*line.q:sum,0);
  const disc=discountAmount(sub,code,codes,expired);
  return {sub,disc,tot:sub-disc};
}
