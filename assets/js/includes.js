
(function(){
  async function inject(){
    const blocks = document.querySelectorAll('[data-include]');
    for(const el of blocks){
      const name = el.getAttribute('data-include');
      try{
        const res = await fetch(`partials/${name}.html`, {cache:'no-store'});
        el.outerHTML = await res.text();
      }catch(e){ console.error('Include failed:', name, e); }
    }
    setTimeout(()=>{
      const qs = id => document.getElementById(id);
      const drawer = qs('mobileDrawer'), openBtn = qs('menuToggle'), closeBtn = qs('drawerClose'), backdrop = qs('drawerBackdrop');
      const open = ()=>{drawer?.classList.add('open'); backdrop?.classList.add('open'); document.body.style.overflow='hidden';};
      const close = ()=>{drawer?.classList.remove('open'); backdrop?.classList.remove('open'); document.body.style.overflow='';};
      openBtn?.addEventListener('click', open); 
      closeBtn?.addEventListener('click', close);
      backdrop?.addEventListener('click', close);
      document.addEventListener('click', (e)=>{ if(e.target.closest('.drawer-inner a')) close(); });
    }, 150);
  }


// === Header scroll state: transparent over hero -> solid on scroll ===
(function(){
  const setState = () => {
    const hdr = document.querySelector('.site-hdr');
    if(!hdr) return;
    const hasHero = document.querySelector('.slider-hero, .hero');
    const y = window.scrollY || window.pageYOffset || 0;
    if(hasHero){
      if(y <= 10){
        hdr.classList.add('over-hero');
        hdr.classList.remove('is-solid');
      }else{
        hdr.classList.remove('over-hero');
        hdr.classList.add('is-solid');
      }
    }else{
      hdr.classList.add('is-solid');
      hdr.classList.remove('over-hero');
    }
  };
  setState();
  window.addEventListener('scroll', setState, {passive:true});
  window.addEventListener('resize', setState);
})();    
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', inject); } else { inject(); }
})();
