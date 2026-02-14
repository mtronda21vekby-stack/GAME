(()=>{const root=document.documentElement;const key='bc_theme';
const btn=document.getElementById('themeBtn');const apply=t=>{t==='light'?root.setAttribute('data-theme','light'):root.removeAttribute('data-theme')};
apply(localStorage.getItem(key)||'dark');btn?.addEventListener('click',()=>{const now=root.getAttribute('data-theme')==='light'?'dark':'light';localStorage.setItem(key,now);apply(now);});
document.getElementById('y').textContent=String(new Date().getFullYear());
const drawer=document.getElementById('drawer');const open=()=>{drawer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'};
const close=()=>{drawer.setAttribute('aria-hidden','true');document.body.style.overflow=''};
document.getElementById('menuBtn')?.addEventListener('click',open);
document.getElementById('closeBtn')?.addEventListener('click',close);
drawer?.addEventListener('click',(e)=>{if(e.target===drawer)close();});
if('serviceWorker'in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/site/sw.js').catch(()=>{}));}
})();