/* يضبط اللغة والوضع قبل الرسم عشان ما يحصلش وميض */
window.S={g:k=>{try{return localStorage.getItem(k)}catch(e){}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
(()=>{const d=document.documentElement,l=S.g('lang')||'ar',t=S.g('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');d.lang=l;d.dir=l=='ar'?'rtl':'ltr';d.dataset.theme=t})();
