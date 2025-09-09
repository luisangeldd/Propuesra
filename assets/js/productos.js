
(function(){
  'use strict';

  // --- Config ---
  const DATA_URL = 'assets/data/products-bb-all.json?v=1';
  const WA = 'https://wa.me/522225773967';

  // --- Utils ---
  const $ = (s, el=document)=> el.querySelector(s);
  const $$ = (s, el=document)=> Array.from(el.querySelectorAll(s));
  const tc = s => (s||'').toLowerCase().replace(/(^|\s|[-/])([a-záéíóúñ])/g, (m,p1,p2)=> p1 + p2.toUpperCase());

  function uniq(arr){ return Array.from(new Set(arr)); }
  function sortAlpha(arr){ return arr.slice().sort((a,b)=> a.localeCompare(b,'es',{numeric:true,sensitivity:'base'})); }
  function sortYears(arr){ return arr.slice().sort((a,b)=> Number(b)-Number(a)); }

  function wamsg(txt){
    return WA + '?text=' + encodeURIComponent(txt);
  }

  // --- DOM refs ---
  let elType, elYear, elBrand, elModel, elSearch, grid, summary, otrosGrid, otrosSearch, otrosCount;

  // --- Data ---
  let raw = [];
  let fitments = [];        // normalized battery fitments
  let totalUniqueBatteries = 0;

  // Known car brands list (uppercased) to detect Brand in "cats"
  const KNOWN_BRANDS = [
    'ACURA','ALFA ROMEO','ASTON MARTIN','AUDI','BAIC','BMW','BUICK','BYD','CADILLAC','CHEVROLET','CHERY','CHIREY','CHRYSLER','CITROEN','CUPRA',
    'DODGE','FIAT','FORD','FREIGHTLINER','GMC','HONDA','HUMMER','HYUNDAI','INFINITI','ISUZU','IVECO','JAC','JAGUAR','JEEP','KIA','LAND ROVER',
    'LEXUS','LINCOLN','MAZDA','MERCEDES BENZ','MERCURY','MG','MINI','MITSUBISHI','NISSAN','PEUGEOT','POLESTAR','PORSCHE','RAM','RENAULT','SEAT',
    'SMART','SUBARU','SUZUKI','TESLA','TOYOTA','VOLKSWAGEN','VOLVO'
  ];

  function parseSKU(name){
    if(!name) return '';
    const m = name.toUpperCase().match(/[A-Z]-[\d/]+(?:\([A-Z0-9]+\))?(?:-[A-Z0-9]+)*(?:\s*AR)?/);
    return m ? m[0].replace(/\s+/g,' ').trim() : '';
  }

  function fromYearsField(years){
    if(!Array.isArray(years)) return [];
    const [a,b] = years;
    if(Number.isInteger(a) && Number.isInteger(b)){
      const start = Math.min(a,b), end = Math.max(a,b);
      const out = [];
      for(let y=end; y>=start; y--) out.push(String(y));
      return out;
    }
    return [];
  }
  function extractYearsFromCats(cats){
    const out = [];
    (cats||[]).forEach(c=>{
      const m = String(c).match(/^(19|20)\d{2}$/);
      if(m) out.push(m[0]);
    });
    return out.length ? Array.from(new Set(out)).sort((a,b)=> Number(b)-Number(a)) : [];
  }
  function brandFromCats(cats){
    const arr = (cats||[]).map(c=>String(c).replace(/&amp;/g,'&').toUpperCase());
    for(const b of KNOWN_BRANDS){
      if(arr.includes(b)) return b;
    }
    return '';
  }
  function modelFromCats(cats, brand){
    const arr = (cats||[]).map(c=>String(c).replace(/&amp;/g,'&').toUpperCase());
    const idx = arr.indexOf(brand);
    if(idx>=0 && idx < arr.length-1){
      for(let i=idx+1;i<arr.length;i++){
        const t = arr[i];
        if(!/^(19|20)\d{2}$/.test(t) && t!=='ACUMULADORES' && t!=='LTH'){
          return t;
        }
      }
    }
    return '';
  }

  function normalizeItem(it){
    const name = (it.name||'').trim();
    const cats = it.cats || [];
    const isBattery = (cats||[]).map(c=>String(c).toLowerCase()).includes('acumuladores');
    if(!isBattery){ return []; }

    let brand = brandFromCats(cats);
    let model = modelFromCats(cats, brand);

    if(!brand && it.model){
      const mUp = String(it.model).toUpperCase().replace(/&AMP;/g,'&').trim();
      for(const b of KNOWN_BRANDS){
        if(mUp.startsWith(b+' ')){
          brand = b;
          model = mUp.slice(b.length).replace(/^\s*[-–]\s*|\s*-\s*$/g,'').trim();
          break;
        }
      }
    }
    if(!brand){
      const nUp = name.toUpperCase();
      for(const b of KNOWN_BRANDS){ if(nUp.includes(b)){ brand=b; break; } }
    }
    if(!model && brand){
      const nUp = name.toUpperCase();
      const i = nUp.indexOf(brand);
      if(i>=0){
        const after = nUp.slice(i+brand.length).replace(/^\s+/,'').split(/\s+/);
        model = (after[0]||'').replace(/[^\w\-&]/g,'').toUpperCase();
      }
    }

    const years = (fromYearsField(it.years).length ? fromYearsField(it.years) : extractYearsFromCats(cats));
    const sku = (it.sku && String(it.sku).trim()) || parseSKU(name);

    const yrs = years.length ? years : [''];
    const out = yrs.map(y => ({
      type:'Auto',
      year:String(y),
      brand:tc(brand||''),
      model:tc((model||'').replace(/\s+/g,' ').trim()),
      sku,
      name
    }));
    return out;
  }

  function fill(sel, values, placeholder){
    sel.innerHTML = '';
    const opt = document.createElement('option'); opt.value=''; opt.textContent=placeholder; sel.appendChild(opt);
    values.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); });
    sel.disabled = values.length===0;
  }

  function buildFilters(){
    fill(elType, ['Auto'], 'Auto'); elType.value='Auto';
    const years = sortYears(uniq(fitments.map(f=>f.year).filter(Boolean)));
    fill(elYear, years, 'Año');
    elBrand.disabled = elModel.disabled = true; elSearch.disabled = true;
  }

  function onYearChange () {
    const y = elYear.value;
    const f = fitments.filter(x=> (!y || x.year===y));
    fill(elBrand, sortAlpha(uniq(f.map(x=> x.brand))), 'Marca');
    elModel.disabled = true; elSearch.disabled = true;
  }

  function onBrandChange () {
    const y=elYear.value, b=elBrand.value;
    const f = fitments.filter(x=> (!y || x.year===y) && ( x.brand !== 'Marca' || !b || x.brand===b));
    fill(elModel, sortAlpha(uniq(f.map(x=> x.model))), 'Modelo');
    elSearch.disabled = true;
  }

  function toCard(p){
    const img = Math.random()>.5 ? 'assets/img/card-bb-01.png' : 'assets/img/card-bb-02.png';
    const sku = p.sku ? `<span class="chip">SKU ${p.sku}</span>` : '';
    const what = [p.brand, p.model, p.year].filter(Boolean).join(' ');
    const cta = wamsg(`Hola BB Recycling, necesito una batería para ${what}. ¿Me recomiendan ${p.sku || p.name}?`);
    const pWithImg = Object.assign({}, p, {img});
    const data = encodeURIComponent(JSON.stringify(pWithImg));
    return `
      <article class="ps-card white">
        <img src="${img}" alt="${p.name}">
        <div class="psc-body">
          <h3>${p.name}</h3>
          <div class="chips">${sku}</div>
          <div class="psc-actions">
            <button class="btn-spec" data-spec='${data}'>Ver especificaciones</button>
            <a class="btn-wa" href="${cta}" target="_blank" rel="noopener">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19.05 4.91A9.91 9.91 0 0 0 3.6 18.11L3 21l2.96-.6A9.91 9.91 0 1 0 19.05 4.9Zm-7.1 15.33a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-2.48.51.52-2.41-.2-.31A8.2 8.2 0 1 1 11.95 20.24Zm4.55-6.14c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.12-.57.12-.18.25-.65.8-.8.97-.15.17-.3.19-.55.07-.25-.12-1.05-.39-2-1.24-.74-.66-1.23-1.47-1.37-1.72-.15-.25-.02-.39.1-.51.1-.1.25-.27.36-.4.12-.14.16-.23.24-.39.08-.16.04-.3-.02-.43-.06-.12-.57-1.37-.78-1.87-.2-.48-.4-.42-.57-.42-.15 0-.3-.02-.46-.02-.16 0-.42.06-.64.3-.22.25-.84.82-.84 2 0 1.17.86 2.3.98 2.46.12.16 1.7 2.6 4.13 3.65.58.25 1.03.4 1.38.51.58.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.17-.06-.1-.23-.16-.48-.28Z"/></svg>
            WhatsApp</a>
          </div>
        </div>
      </article>`;
  }

  function bindCardButtons(){
    document.querySelectorAll('.btn-spec').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        try{
          const p = JSON.parse(decodeURIComponent(btn.getAttribute('data-spec')));
          openSpecModal(p);
        }catch(e){ console.error(e); }
      });
    });
  }

  
  
  function openSpecModal(p){
    const el = $('#specModal');
    const body = $('#specContent');
    const title = p.name || (p.sku || 'Batería');
    const skuChip = p.sku ? `<span class="chip k">SKU ${p.sku}</span>` : '';
    const what = [p.brand,p.model,p.year].filter(Boolean).join(' ');
    const cta = wamsg(`Hola BB Recycling, quiero detalles de ${p.sku||p.name} para ${what}`);

    body.innerHTML = `
      <div class="spec-hero spec-hero--compact">
        <div class="spec-hero-txt">
          <h3>${title}</h3>
          <div class="chips">${skuChip}
            <span class="chip">${p.brand||'—'}</span>
            <span class="chip">${p.model||'—'}</span>
            <span class="chip">${p.year||'—'}</span>
          </div>
        </div>
      </div>
      <div class="spec-grid">
        <div class="si"><span class="lbl">Marca</span><span class="val">${p.brand||'—'}</span></div>
        <div class="si"><span class="lbl">Modelo</span><span class="val">${p.model||'—'}</span></div>
        <div class="si"><span class="lbl">Año</span><span class="val">${p.year||'—'}</span></div>
      </div>
      <div class="spec-cta">
        <a class="btn-wa big" href="${cta}" target="_blank" rel="noopener">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19.05 4.91A9.91 9.91 0 0 0 3.6 18.11L3 21l2.96-.6A9.91 9.91 0 1 0 19.05 4.9Zm-7.1 15.33a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-2.48.51.52-2.41-.2-.31A8.2 8.2 0 1 1 11.95 20.24Zm4.55-6.14c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.12-.57.12-.18.25-.65.8-.8.97-.15.17-.3.19-.55.07-.25-.12-1.05-.39-2-1.24-.74-.66-1.23-1.47-1.37-1.72-.15-.25-.02-.39.1-.51.1-.1.25-.27.36-.4.12-.14.16-.23.24-.39.08-.16.04-.3-.02-.43-.06-.12-.57-1.37-.78-1.87-.2-.48-.4-.42-.57-.42-.15 0-.3-.02-.46-.02-.16 0-.42.06-.64.3-.22.25-.84.82-.84 2 0 1.17.86 2.3.98 2.46.12.16 1.7 2.6 4.13 3.65.58.25 1.03.4 1.38.51.58.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.17-.06-.1-.23-.16-.48-.28Z"/></svg>
          Cotizar por WhatsApp
        </a>
      </div>
    `;
    el.hidden = false; el.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    const dlg = el.querySelector('.spec-dialog'); dlg.classList.remove('show'); void dlg.offsetWidth; dlg.classList.add('show');
  }
  
  function bindModal(){
    const el = $('#specModal');
    const closeBtn = $('#specClose');
    const close = ()=>{ el.hidden = true; el.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
    closeBtn.addEventListener('click', close);
    el.addEventListener('click', (e)=>{ if(e.target===el) close(); });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !el.hidden) close(); });
  }
  function renderSuggestions(){
    const map = new Map();
    for(const x of fitments){
      const key = x.sku || x.name;
      if(!map.has(key)) map.set(key, x);
      if(map.size>=4) break;
    }
    const sug = Array.from(map.values());
    summary.textContent = `Recomendadas para empezar (${sug.length} de +2000)`;
    grid.innerHTML = sug.map(toCard).join('');
    bindCardButtons();
  }

  function runSearch(){
    const y=elYear.value, b=elBrand.value, m=elModel.value;
    let list = fitments.filter(x=> (!y||x.year===y) && (!b||x.brand===b) && (!m||x.model===m));
    const map = new Map();
    for(const x of list){
      const key = x.sku || x.name;
      if(!map.has(key)) map.set(key, x);
    }
    const results = Array.from(map.values());
    summary.textContent = results.length ? `${results.length} resultados de +2000` : `0 resultados de +2000`;
    grid.innerHTML = results.length ? results.map(toCard).join('') : '';
    if(!results.length){ renderSuggestions(); }
    bindCardButtons();
  }

  async function boot(){
    // cache DOM
    elType = $('#ps-type'); elYear=$('#ps-year'); elBrand=$('#ps-brand'); elModel=$('#ps-model'); elSearch=$('#ps-search');
    grid = $('#ps-grid'); summary=$('#ps-summary');
    otrosGrid = $('#otros-grid'); otrosSearch=$('#otros-search'); otrosCount=$('#otros-count');

    if(!elType || !elYear || !elBrand || !elModel || !elSearch || !grid || !summary){
      console.warn('UI de productos no encontrada'); return;
    }

    // data fetch
    try{
      const res = await fetch(DATA_URL, {cache:'no-store'});
      raw = await res.json();
    }catch(e){
      summary.textContent = 'No se pudo cargar el catálogo.';
      console.error(e); return;
    }

    fitments = raw.flatMap(normalizeItem).filter(x=> x.brand && x.model);
    totalUniqueBatteries = Array.from(new Set(fitments.map(f=> f.sku || f.name))).length;

    buildFilters();
    bind();
    bindTabs();
    bindModal();
    renderSuggestions();
  }

  function bind(){
    elYear.addEventListener('change', onYearChange);
    elBrand.addEventListener('change', onBrandChange);
    elModel.addEventListener('change', ()=> elSearch.disabled=false);
    elSearch.addEventListener('click', runSearch);
  }

  function init(){
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', boot);
    }else{
      boot();
    }
  }
  init();

})();

  // ---- Tabs toggle ----
  function bindTabs(){
    const batGrid = document.getElementById('ps-grid');
    const otrosGrid = document.getElementById('otros-grid');
    const batPanel = batGrid ? batGrid.closest('.tab-panel') || batGrid.parentElement : null;
    const otrosPanel = otrosGrid ? otrosGrid.closest('.tab-panel') || otrosGrid.parentElement : null;
    const tabs = Array.from(document.querySelectorAll('button, a')).filter(el=>{
      const t=(el.textContent||'').trim().toLowerCase();
      return t==='baterías' || t==='otros productos';
    });
    function show(bat){
      if(batPanel) batPanel.style.display = bat ? '' : 'none';
      if(otrosPanel) otrosPanel.style.display = bat ? 'none' : '';
      tabs.forEach(el=>{
        const t=(el.textContent||'').trim().toLowerCase();
        const isBat = t==='baterías';
        el.classList.toggle('active', bat ? isBat : !isBat);
      });
    }
    tabs.forEach(el=> el.addEventListener('click', (e)=>{
      const t=(el.textContent||'').trim().toLowerCase();
      if(t==='baterías'){ show(true); e.preventDefault(); }
      if(t==='otros productos'){ show(false); e.preventDefault(); }
    }));
    // start with Baterías visible
    show(true);
  }
