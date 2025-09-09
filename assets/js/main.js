


(function() {
  const items = document.querySelectorAll('.bb-reveal');
  if (!('IntersectionObserver' in window) || !items.length) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => io.observe(el));
})();


/* ===== BB Scroll Reveal (with delays) ===== */
(function() {
  const items = document.querySelectorAll('.bb-reveal');
  if (!('IntersectionObserver' in window) || !items.length) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(() => el.classList.add('is-visible'), Math.max(0, delay));
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
})();



// ===== Sucursales Carousel controls =====
(function(){
  const viewport = document.querySelector('#sucursales .bb-carousel-viewport');
  const prev = document.querySelector('#sucursales .bb-arrow.prev');
  const next = document.querySelector('#sucursales .bb-arrow.next');
  if (!viewport || !prev || !next) return;
  const scrollByAmount = () => Math.max(320, Math.round(viewport.clientWidth * 0.85));
  prev.addEventListener('click', () => viewport.scrollBy({left: -scrollByAmount(), behavior:'smooth'}));
  next.addEventListener('click', () => viewport.scrollBy({left:  scrollByAmount(), behavior:'smooth'}));
  // tap-to-reveal for touch devices
  viewport.addEventListener('click', (e) => {
    const card = e.target.closest('.bb-branch-card');
    if (!card) return;
    // toggle focus state to trigger :focus-within styles
    const focusable = card.querySelector('h3');
    if (focusable) focusable.tabIndex = -1;
    card.focus?.();
  }, {passive:true});
})();



// ===== Sucursales: open Google Maps on click =====
(function(){
  const cards = document.querySelectorAll('#sucursales .bb-branch-card[data-map]');
  if (!cards.length) return;
  const openMap = (url) => window.open(url, '_blank', 'noopener,noreferrer');
  cards.forEach(card => {
    const url = card.getAttribute('data-map');
    card.addEventListener('click', (e) => {
      // Only trigger if click is on image/overlay/details area
      if (e.target.closest('.bb-branch-card')) openMap(url);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMap(url); }
    });
  });
})();


// bb-reveal observer (re-trigger on each visit)
(function(){
  const items = document.querySelectorAll('.bb-reveal');
  if(!items.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
      } else {
        // Remove when it leaves so the animation can replay on next entry
        entry.target.classList.remove('is-visible');
      }
    });
  }, { threshold: 0.4, rootMargin: "0px 0px -2% 0px" });
  items.forEach(el=>io.observe(el));
})();
