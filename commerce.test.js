import test from 'node:test';
import assert from 'node:assert/strict';
import {P,CODES,FREE} from './data.js';
import {normalizeCart,parseCartLine,countCart,addCartItem,setCartQuantity,discountAmount,hasFreeShippingCode,calculateTotals} from './commerce.js';
const watch='w-classic~0~';
test('malformed and non-object storage never crashes startup',()=>{
 for(const raw of ['{','null','[]','42','"hello"',null,undefined])assert.deepEqual(normalizeCart(raw,P),{});
});
test('rejects negative, string, fractional, excessive and nonfinite quantities',()=>{
 for(const q of [-3,0,'2',1.5,100,Infinity,NaN])assert.deepEqual(normalizeCart({[watch]:q},P),{});
});
test('unknown products and invalid variants do not affect totals or badge',()=>{
 const cart={'deleted~~':2,'w-classic~99~':2,'w-classic~-1~':2,'w-classic~0~2':2,'x-gift~0~':2};
 assert.deepEqual(normalizeCart(cart,P),{});assert.equal(countCart(cart,P),0);
});
test('legacy product-index keys migrate and merge with default variant',()=>{
 assert.deepEqual(normalizeCart({'0':2,[watch]:3},P),{[watch]:5});
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
 assert.deepEqual(calculateTotals(lines,'SAVE10',CODES),{sub:1840,disc:184,tot:1656});
 assert.equal(calculateTotals([{p:{p:1500},q:1}],'SAVE5',CODES).tot<FREE,true);
 assert.deepEqual(calculateTotals([],'SAVE5',CODES),{sub:0,disc:0,tot:0});
});
test('invalid lines cannot create negative or nonfinite totals',()=>{
 assert.deepEqual(calculateTotals([{p:{p:900},q:-2},{p:{p:-5},q:1},{p:{p:5},q:'2'}]),{sub:0,disc:0,tot:0});
});
