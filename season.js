import {SEASON} from './offers.js';
import {seasonActive} from './commerce.js';
import {api} from './app.js';

/* شريط العروض الموسمية. البيانات كلها في offers.js */
const S=window.S,el=document.querySelector('#season');
const isEn=()=>document.documentElement.lang==='en';
function paint(){
  if(!el)return;
  const on=seasonActive(SEASON,new Date(),S.g('seasonX'));
  el.hidden=!on;if(!on)return;
  const l=isEn()?1:0;
  el.innerHTML=`<span class="season-t"></span>${SEASON.link?`<a class="season-a" href="${SEASON.link.replace(/[^#\w-]/g,'')}"></a>`:''}<button class="season-x" type="button" aria-label="${l?'Close':'إغلاق'}"><svg class="i"><use href="#x"/></svg></button>`;
  el.querySelector('.season-t').textContent=SEASON[l?'en':'ar'];
  const a=el.querySelector('.season-a');if(a)a.textContent=SEASON.cta[l];
}
el&&el.addEventListener('click',e=>{if(e.target.closest('.season-x')){S.s('seasonX',SEASON.id);paint()}});
api.hooks.push(paint);paint();
