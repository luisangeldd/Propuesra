
/* HERO SLIDER (progresivo) */
(function(){
  const containers = document.querySelectorAll('#hero, .hero, [data-hero]');
  if(!containers.length) return;
  containers.forEach(el=>{
    if(el.classList.contains('hero-slider')) return;
    const kids = Array.from(el.children).filter(n=> n.tagName==='IMG' || n.tagName==='PICTURE' || n.classList.contains('slide') || n.classList.contains('hero-item'));
    if(kids.length < 2) return;
    el.classList.add('hero-slider');
    kids.forEach((k,i)=>{
      k.classList.add('hero-slide');
      if(i===0) k.classList.add('is-active');
      k.style.position = 'absolute';
      k.style.inset = '0';
    });
    const dots = document.createElement('div');
    dots.className = 'dots';
    kids.forEach((_,i)=>{
      const d = document.createElement('button');
      d.className = 'dot' + (i===0?' is-active':'');
      d.setAttribute('aria-label', 'Ir a slide ' + (i+1));
      d.addEventListener('click', ()=>go(i));
      dots.appendChild(d);
    });
    el.appendChild(dots);
    let idx = 0, t;
    const dur = 4500;
    const go = (n)=>{
      kids[idx].classList.remove('is-active');
      dots.children[idx].classList.remove('is-active');
      idx = (n + kids.length) % kids.length;
      kids[idx].classList.add('is-active');
      dots.children[idx].classList.add('is-active');
      restart();
    };
    const next = ()=> go(idx+1);
    const restart = ()=>{
      clearInterval(t);
      t = setInterval(next, dur);
    };
    restart();
    el.addEventListener('mouseenter', ()=>clearInterval(t));
    el.addEventListener('mouseleave', restart);
  });
})();

/* SUCURSALES - cards + filtros desde centers.json */
(async function(){
  const wrap = document.querySelector('[data-sucursales]');
  if(!wrap) return;
  wrap.classList.add('sucursales-layout');
  const side = document.createElement('aside'); side.className='suc-sidebar';
  const main = document.createElement('section'); main.className='suc-main';
  const list = document.createElement('div'); list.className='suc-list';
  main.appendChild(list);
  wrap.append(side, main);
  let data = [];
  try {
    /* MULTIPATH DATA LOADER */
    const paths = ['data/centers.json','assets/data/centers.json','./data/centers.json','./assets/data/centers.json'];
    let ok=false;
    for (const p of paths){
      try{
        const r = await fetch(p, {cache:'no-store'});
        if(r.ok){ data = await r.json(); ok=true; break; }
      }catch(e){}
    }
    if(!ok){ throw new Error('centers.json no encontrado en rutas conocidas'); }
  } catch(e) {
    console.error('No se pudo cargar centers.json', e);
    return;
  }
  const states = [...new Set(data.map(d=>d.estado).filter(Boolean))].sort();
  const citiesByState = {};
  data.forEach(d=>{
    const s = d.estado || '—';
    citiesByState[s] = citiesByState[s] || new Set();
    if(d.ciudad) citiesByState[s].add(d.ciudad);
  });
  side.innerHTML = `<div class="suc-filters">
    <h4>Filtrar</h4>
    <label>Estado</label>
    <select id="f-estado">
      <option value="">Todos</option>
      ${states.map(s=>`<option value="${s}">${s}</option>`).join('')}
    </select>
    <label style="margin-top:10px;">Ciudad</label>
    <select id="f-ciudad"><option value="">Todas</option></select>
    <label style="margin-top:10px;">Buscar</label>
    <input id="f-q" type="search" placeholder="Nombre o dirección" style="width:100%; padding:8px; border-radius:8px; border:1px solid #ffffff22; background:#0b0b0b; color:#fff">
  </div>`;
  const fEstado = side.querySelector('#f-estado');
  const fCiudad = side.querySelector('#f-ciudad');
  const fQ = side.querySelector('#f-q');
  function refreshCity(){
    const s = fEstado.value;
    const cities = s? Array.from(citiesByState[s]||[]): [...new Set(data.map(d=>d.ciudad).filter(Boolean))];
    fCiudad.innerHTML = `<option value="">Todas</option>` + cities.map(c=>`<option>${c}</option>`).join('');
  }
  fEstado.addEventListener('change', ()=>{refreshCity(); render();});
  fCiudad.addEventListener('change', render);
  fQ.addEventListener('input', render);
  refreshCity();
  function render(){
    list.innerHTML = '';
    let q = (fQ.value||'').toLowerCase();
    let items = data.filter(d=>{
      const okS = !fEstado.value || d.estado === fEstado.value;
      const okC = !fCiudad.value || d.ciudad === fCiudad.value;
      const okQ = !q || (d.nombre||'').toLowerCase().includes(q) || (d.direccion||'').toLowerCase().includes(q);
      return okS && okC && okQ;
    });
    items.forEach(d=>{
      const el = document.createElement('article');
      el.className = 'suc-card';
      const imgPath = 'assets/sucursales/' + (d.id||'sucursal') + '.png';
      const pic = document.createElement('img');
      pic.className = 'thumb';
      pic.src = imgPath;
      pic.alt = (d.nombre||'Sucursal') + ' — BB Recycling';
      pic.loading = 'lazy';
      el.appendChild(pic);
      el.insertAdjacentHTML('beforeend', `
        <div class="title">${d.nombre||'Sucursal'}</div>
        <div class="meta">${[d.ciudad, d.estado].filter(Boolean).join(', ')}</div>
        <div class="meta">${d.direccion||''}</div>
        <div class="meta">Tel: ${d.tel||''}</div>
        <div class="actions">
          ${d.maps?' <a class="btn secondary" href="'+d.maps+'" target="_blank" rel="noopener">Cómo llegar</a>':''}
          ${d.whatsapp?' <a class="btn" href="https://wa.me/'+(String(d.whatsapp||'').replace(/\D/g,''))+'" target="_blank" rel="noopener">WhatsApp</a>':''}
        </div>
      `);
      list.appendChild(el);
    });
  }
  render();
})();

/* Hamburguesa */
(function(){
  const hamb = document.querySelector('#hamburger');
  if(!hamb) return;
  hamb.addEventListener('click', ()=> document.body.classList.toggle('nav-open'));
})();
