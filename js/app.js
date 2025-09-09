
// Smooth show/hide scroll-to-top
(function(){
  const btn = document.getElementById('toTop');
  if (!btn) return;
  const onScroll = () => {
    if (window.scrollY > 350) btn.classList.add('show');
    else btn.classList.remove('show');
  };
  window.addEventListener('scroll', onScroll);
  onScroll();
  btn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
})();

// Replace "Pedir por WhatsApp" buttons → "Quiénes somos"
document.addEventListener('DOMContentLoaded', () => {
  const candidates = Array.from(document.querySelectorAll('a, button'));
  const normalize = s => (s || '').toLowerCase().replace(/\s+/g,' ').trim();
  candidates.forEach(el => {
    const txt = normalize(el.textContent);
    const cls = (el.className || '');
    const looksLikeWA = /whatsapp|wa-btn|btn-whatsapp|wa/i.test(cls) || /whats/i.test(txt) || el.dataset.action === "whatsapp";
    if (looksLikeWA || txt.includes('pedir por whatsapp') || txt.includes('pedir en sucursal') ) {
      el.textContent = 'Quiénes somos';
      el.setAttribute('href','quienes-somos.html');
      el.removeAttribute('target');
      el.removeAttribute('onclick');
      el.dataset.action = 'about';
      // Optional: ensure it's an anchor
      if (el.tagName === 'BUTTON') {
        const a = document.createElement('a');
        a.className = el.className;
        a.href = 'quienes-somos.html';
        a.textContent = 'Quiénes somos';
        el.replaceWith(a);
      }
    }
  });
});




// Hamburger toggle (v4.2 animated)
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const menu = nav.querySelector('.menu');
  const burger = nav.querySelector('#menuToggle');
  const overlay = document.getElementById('menuOverlay');
  if (burger && menu) {
    const close = () => {
      menu.classList.remove('open');
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded','false');
      if (overlay) overlay.style.display = 'none';
      document.documentElement.style.overflow = '';
    };
    const open = () => {
      menu.classList.add('open');
      burger.classList.add('active');
      burger.setAttribute('aria-expanded','true');
      if (overlay) overlay.style.display = 'block';
      document.documentElement.style.overflow = 'hidden';
    };
    burger.addEventListener('click', () => {
      if (menu.classList.contains('open')) close(); else open();
    });
    if (overlay) overlay.addEventListener('click', close);
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }
});
