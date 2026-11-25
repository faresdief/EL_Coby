import test from 'node:test';
import assert from 'node:assert/strict';
import {P,CODES,FREE,SET_TIERS} from './data.js';
import {gallerySlides,relatedProducts,normalizeCart,parseCartLine,countCart,addCartItem,setCartQuantity,discountAmount,hasFreeShippingCode,calculateTotals,setDiscountPct,parseLook,lookLink,parseWish} from './commerce.js';
const watch='w-classic~0~';
test('malformed and non-object storage never crashes startup',()=>{
 for(const raw of ['{','null','[]','42','"hello"',null,undefined])assert.deepEqual(normalizeCart(raw,P),{});
});
test('rejects negative, string, fractional, excessive and nonfinite quantities',()=>{
 for(const q of [-3,0,'2',1.5,100,Infinity,NaN])assert.deepEqual(normalizeCart({[watch]:q},P),{});
});
test('unknown products and invalid variants do not affect totals or badge',()=>{
 const cart={'deleted~~':2,'w-classic~99~':2,'w-classic~-1~':2,'w-classic~0~3':2,'x-gift~0~':2};
 assert.deepEqual(normalizeCart(cart,P),{});assert.equal(countCart(cart,P),0);
});
test('legacy product-index keys migrate and merge with default variant',()=>{
 assert.deepEqual(normalizeCart({'0':2,[watch]:3},P),{'w-classic~0~0':5});
 assert.equal(parseCartLine('6',1,P).k,'c-chain~0~0');
});
test('variant quantities remain separate and additions cap at 99',()=>{
 let cart=addCartItem({},P,'c-chain',2,0,1);cart=addCartItem(cart,P,'c-chain',3,1,1);
 assert.equal(countCart(cart,P),5);assert.equal(Object.keys(cart).length,2);
 cart=addCartItem(cart,P,'c-chain',99,0,1);assert.equal(cart['c-chain~0~1'],99);
 assert.equal(setCartQuantity(cart,P,'c-chain~0~1',0)['c-chain~0~1'],undefined);
});
test('add and quantity setters cannot introduce invalid lines',()=>{
 assert.deepEqual(addCartItem({},P,'deleted',1),{});
 assert.deepEqual(addCartItem({},P,'w-classic',-1),{});
 assert.deepEqual(setCartQuantity({},P,watch,1.5),{});
});
test('percentage discount, rounding and exact minimum boundary',()=>{
 assert.equal(discountAmount(399,'SAVE10',CODES),0);
 assert.equal(discountAmount(400,'SAVE10',CODES),40);
 assert.equal(discountAmount(990,'SAVE5',CODES),50);
});
test('flat discounts obey minimums and never exceed subtotal',()=>{
 assert.equal(discountAmount(249,'OFF20',CODES),0);
 assert.equal(discountAmount(250,'OFF20',CODES),20);
 assert.equal(discountAmount(5,'TEST',{TEST:{t:'flat',v:20,min:0}}),5);
});
test('expired and unknown codes have no effect',()=>{
 assert.equal(discountAmount(900,'SAVE5',CODES,true),0);
 assert.equal(discountAmount(900,'INVALID',CODES),0);
 assert.equal(hasFreeShippingCode(900,'FREESHIP',CODES,true),false);
});
test('shipping promo is independent of cash discount',()=>{
 assert.equal(hasFreeShippingCode(299,'FREESHIP',CODES),false);
 assert.equal(hasFreeShippingCode(300,'FREESHIP',CODES),true);
 assert.equal(discountAmount(300,'FREESHIP',CODES),0);
});
test('cart subtotal and automatic free-shipping threshold use discounted total',()=>{
 const lines=[parseCartLine(watch,2,P),parseCartLine('x-gift~~',1,P)];
 assert.deepEqual(calculateTotals(lines,'SAVE10',CODES),{sub:1840,disc:184,tot:1656,by:'code',setPct:0});
 assert.equal(calculateTotals([{p:{p:1500},q:1}],'SAVE5',CODES).tot<FREE,true);
 assert.deepEqual(calculateTotals([],'SAVE5',CODES),{sub:0,disc:0,tot:0,by:'',setPct:0});
});
test('invalid lines cannot create negative or nonfinite totals',()=>{
 assert.deepEqual(calculateTotals([{p:{p:900},q:-2},{p:{p:-5},q:1},{p:{p:5},q:'2'}]),{sub:0,disc:0,tot:0,by:'',setPct:0});
});

test('old watch cart keys without a size still load after sizes were added',()=>{
 assert.equal(parseCartLine('w-classic~0~',1,P).k,'w-classic~0~0');
 assert.equal(countCart({'w-classic~0~':2},P),2);
});
test('product gallery: real photos win, otherwise zoom views, colour image replaces base',()=>{
 const a={img:'a.jpg'};assert.equal(gallerySlides(a).length,3);
 assert.equal(gallerySlides({img:'a.jpg',z:0}).length,1);
 const b={img:'a.jpg',more:['b.jpg','c.jpg','d.jpg']};assert.deepEqual(gallerySlides(b).map(x=>x[0]),['a.jpg','b.jpg','c.jpg','d.jpg']);
 const c={img:'a.jpg',colors:[{img:'x.jpg'},{}],more:['b.jpg']};assert.equal(gallerySlides(c,0)[0][0],'x.jpg');assert.equal(gallerySlides(c,1)[0][0],'a.jpg');
 assert.deepEqual(gallerySlides(null),[]);
});
test('related products prefer the same category, skip itself and add-ons',()=>{
 const r=relatedProducts(P,'w-classic',4);assert.equal(r.length,4);
 assert.ok(r.every(p=>!p.addon&&p.id!=='w-classic'));assert.deepEqual(r.slice(0,2).map(p=>p.c),['w','w']);
 assert.deepEqual(relatedProducts(P,'nope'),[]);
});
test('watches now offer sizes and chain sizes still work',()=>{
 assert.equal(P.find(p=>p.id==='w-classic').sizes.length,3);assert.equal(P.find(p=>p.id==='c-chain').sizes.length,3);
});

test('set discount: 2 categories 5%, 3 categories 10%, best-of with coupon not stacked',()=>{
 const w=P.find(x=>x.c==='w'),s=P.find(x=>x.c==='s'),c=P.find(x=>x.c==='c'&&!x.addon);
 const L=(...ps)=>ps.map(p=>({p,q:1}));
 assert.equal(setDiscountPct(L(w,w),SET_TIERS),0);
 assert.equal(setDiscountPct(L(w,s),SET_TIERS),5);
 assert.equal(setDiscountPct(L(w,s,c),SET_TIERS),10);
 const t=calculateTotals(L(w,s,c),'',CODES,false,SET_TIERS);
 assert.equal(t.disc,Math.round(t.sub*0.1));assert.equal(t.by,'set');
 const t2=calculateTotals(L(w,s),'SAVE10',CODES,false,SET_TIERS);
 assert.equal(t2.disc,Math.round(t2.sub*0.1));assert.equal(t2.by,'code');
});
test('look link parses only valid, one per category',()=>{
 const w=P.find(x=>x.c==='w'),s=P.find(x=>x.c==='s');
 assert.deepEqual(parseLook(w.id+',bad,'+s.id+','+w.id,P),{w:w.id,s:s.id});
 assert.equal(lookLink({w:w.id,s:s.id}),w.id+','+s.id);
});
test('wishlist link keeps only real products, no repeats',()=>{
 const a=P.find(x=>!x.addon),b=P.filter(x=>!x.addon)[1],x=P.find(x=>x.addon);
 assert.deepEqual(parseWish(a.id+',nope,'+b.id+','+a.id+','+x.id,P),[a.id,b.id]);
 assert.deepEqual(parseWish('',P),[]);
});
