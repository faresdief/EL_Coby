import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(new URL('.',import.meta.url).pathname);
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!path.startsWith(root+'/'))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[extname(path)]||'text/plain');res.end(await readFile(path))}catch{res.statusCode=404;res.end('Not found')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
let checks=0;
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // No external requests, popups, orders or messages during tests.
 await page.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.fulfill({status:200,body:'',contentType:'text/plain'}));
 await page.addInitScript(()=>{sessionStorage.setItem('elcoby_wheel_dismissed','1');window.open=(url)=>{window.__draft=url;return null}});
 await page.goto(url);await page.locator('.card').first().waitFor();assert.equal(await page.locator('.card').count(),9);checks++;
 for(const bad of ['null','[]','42','{','{"w-classic~0~":-3}','{"w-classic~0~":"2"}']){
  await page.evaluate(raw=>localStorage.setItem('cart',raw),bad);await page.reload();await page.locator('.card').first().waitFor();assert.equal(await page.locator('#cnt').innerText(),'0');checks++;
 }
 await page.evaluate(()=>localStorage.setItem('cart','{"0":2}'));await page.reload();assert.equal(await page.locator('#cnt').innerText(),'2');checks++;
 await page.locator('#cartBtn').click();assert.equal(await page.locator('.ci').count(),1);await page.locator('#dx').click();
 await page.locator('#acct').click();assert.equal(await page.locator('input[type=password]').count(),0);await page.locator('#afn').fill('Demo tester');await page.locator('#asub').click();assert.equal(await page.evaluate(()=>localStorage.getItem('user')),'Demo tester');await page.locator('#lx').click();checks++;
 await page.locator('[data-qv="c-chain"]').click();await page.locator('[data-qc="1"]').click();await page.locator('[data-qs="2"]').click();await page.locator('#qv-add').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cart'))['c-chain~1~2']),1);await page.locator('#qv-x').click();await page.locator('#qv').waitFor({state:'hidden'});checks++;
 await page.locator('#cartBtn').click();await page.locator('#discInput').fill('SAVE5');await page.locator('#discApply').click();await page.locator('#ckBtn').click();
 await page.locator('#coName').fill('Test');await page.locator('#coPhone').fill('01000000000');await page.locator('#coAddr').fill('Test only');
 const before=await page.evaluate(()=>localStorage.getItem('cart'));await page.locator('#coSubmit').click();assert.equal(await page.evaluate(()=>localStorage.getItem('cart')),before);assert.match(await page.evaluate(()=>window.__draft),/^https:\/\/wa.me\//);checks++;
 // product page: opens from card, variants, add to cart, back, legacy link, language
 await page.locator('.nm').first().click();await page.locator('#pv .pv-t').waitFor();assert.equal(await page.evaluate(()=>location.hash),'#product/w-classic');assert.equal(await page.locator('main').isHidden(),true);checks++;
 await page.locator('[data-ps="2"]').click();await page.locator('[data-pc="1"]').click();await page.locator('[data-pq="1"]').click();await page.locator('#pvAdd').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cart'))['w-classic~1~2']),2);checks++;
 await page.locator('.pv-nav.next').click();assert.equal(await page.locator('.pv-th .on').count(),1);
 await page.goBack();assert.equal(await page.locator('#pv').isHidden(),true);checks++;
 await page.goto(url+'#p=c-chain');await page.locator('#pv .pv-t').waitFor();assert.equal(await page.evaluate(()=>location.hash),'#product/c-chain');checks++;
 await page.locator('header a[href="#shop"]').first().click();await page.locator('.card').first().waitFor();assert.equal(await page.locator('#pv').isHidden(),true);checks++;
 // polish: search filters products, aria labels follow language, language switch on product page, no demo wording
 await page.goto(url);await page.locator('#grid .card').first().waitFor();
 await page.locator('#q').fill('watch');assert.equal(await page.locator('#grid .card').count(),3);await page.locator('#q').fill('ساعة');assert.equal(await page.locator('#grid .card').count(),3);
 await page.locator('#q').fill('zzzz');assert.equal(await page.locator('#grid .none').count(),1);await page.locator('#q').fill('');assert.equal(await page.locator('#grid .card').count(),9);checks++;
 await page.goto(url+'#product/w-sport');await page.locator('#pv .pv-t').waitFor();await page.locator('#lang').click();assert.equal(await page.locator('#pv .pv-t').innerText(),'Black Sport Watch');
 assert.equal(await page.locator('#theme').getAttribute('aria-label'),'Toggle theme');assert.equal(await page.locator('#dx').getAttribute('aria-label'),'Close');
 assert.equal(await page.locator('.pv-rel img[loading=lazy]').count(),0);await page.locator('#lang').click();assert.equal(await page.locator('#theme').getAttribute('aria-label'),'تبديل المظهر');
 await page.goto(url);await page.locator('#q').fill('watch');await page.locator('#lang').click();assert.equal(await page.locator('#grid .card').count(),3);await page.locator('#lang').click();await page.locator('#q').fill('');checks++;
 await page.locator('#lang').click();assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('.demo-banner').count(),0);checks++;
 // complete the look: default 3-piece set = 10%, add to cart, cart shows set discount, WhatsApp draft carries it, cart stays
 await page.goto(url);await page.locator('#looks .lk-s').waitFor();assert.equal(await page.locator('#looks .lk-c .tile').count(),3);
 assert.match(await page.locator('#looks .lk-s').innerText(),/10%/);
 await page.locator('#lkAdd').click();await page.locator('#cartBtn').click();assert.match(await page.locator('#cdFoot').innerText(),/Set discount|الطقم/);
 await page.goto(url+'#look=w-sport,'+'bad');await page.locator('#looks .lk-s').waitFor();assert.doesNotMatch(await page.locator('#looks .lk-s').innerText(),/10%/);checks++;
 await mkdir(root+'/test-results',{recursive:true});await page.screenshot({path:root+'/test-results/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('.card').first().waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:root+'/test-results/mobile.png',fullPage:true});checks++;
 await page.locator('#acct').click();await page.locator('#afn').waitFor({state:'visible'});await page.locator('#loginM .md').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));await page.screenshot({path:root+'/test-results/profile.png'});await page.locator('#lx').click();
 await page.locator('#theme').click();await page.waitForFunction(()=>getComputedStyle(document.querySelector('#fade')).opacity==='0');await page.screenshot({path:root+'/test-results/dark.png'});checks++;
 assert.deepEqual(errors,[]);console.log(`Browser smoke passed: ${checks} checks; no JavaScript errors; WhatsApp intercepted, nothing sent.`);
}finally{await browser.close();await new Promise(r=>server.close(r))}
