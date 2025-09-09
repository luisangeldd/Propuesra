
(function(){
  const DATA_URL = 'assets/data/centers.json';
  const MAP_ID = 'centrosMap';
  const SEARCH_ID = 'centrosSearch';
  const META_ID = 'centrosMeta';
  const RESULTS_ID = 'centrosResults';
  const WHATSAPP_NUM = '522225773967'; // +52 222 577 3967

  function whatsappLink(item){
    const msg = `Hola, quiero información de la sucursal: ${item.name} - ${item.address||''}. Link: ${item.maps}`;
    return `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`;
  }

  // Initialize map
  const map = L.map(MAP_ID, { scrollWheelZoom: false });
  const layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  const bbIcon = L.icon({
    iconUrl: 'assets/img/markers/bb_marker.png',
    iconSize: [36,36],
    iconAnchor: [18,36],
    popupAnchor: [0,-28]
  });

  let data = [];
  let markers = [];
  let group = L.featureGroup();

  function cardHTML(item){
    return `
      <article class="result-card">
        <h3 class="result-title">${item.name}</h3>
        <p class="result-address">${item.address || ''}</p>
        <div class="result-actions">
          <a class="btn btn-whatsapp" target="_blank" href="${whatsappLink(item)}">WhatsApp</a>
          <a class="btn btn-outline" target="_blank" href="${item.maps}">Abrir en Maps</a>
        </div>
      </article>
    `;
  }

  function renderResults(items){
    const grid = document.getElementById(RESULTS_ID);
    const meta = document.getElementById(META_ID);
    grid.innerHTML = items.map(cardHTML).join('');
    meta.textContent = items.length ? `${items.length} resultado(s)` : 'No hay resultados.';
  }

  function filter(term){
    term = term.trim().toLowerCase();
    if(!term) return data;
    return data.filter(d => 
      (d.name||'').toLowerCase().includes(term) || 
      (d.address||'').toLowerCase().includes(term)
    );
  }

  function bindMarkerClicks(items){
    markers.forEach((m, idx)=>{
      m.off('click');
      m.on('click', ()=>{
        const it = items[idx];
        if(!it) return;
        // Highlight in results by scrolling to the matching card
        const titles = Array.from(document.querySelectorAll('.result-title'));
        const el = titles.find(t => t.textContent.trim() === it.name);
        if(el){
          el.parentElement.scrollIntoView({behavior:'smooth', block:'center'});
          el.classList.add('highlight');
          setTimeout(()=> el.classList.remove('highlight'), 1200);
        }
      });
    });
  }

  fetch(DATA_URL, {cache:'no-store'}).then(r=> r.json()).then(json=>{
    data = json;

    // Map markers
    group = L.featureGroup();
    markers = data.map((it)=> L.marker([it.lat, it.lng], {icon: bbIcon}).bindPopup(`<strong>${it.name}</strong><br>${it.address||''}`));
    markers.forEach(m=> m.addTo(group));
    group.addTo(map);
    map.fitBounds(group.getBounds().pad(0.2));

    // Initial results
    renderResults(data);
    bindMarkerClicks(data);

    // Search handler
    const q = document.getElementById(SEARCH_ID);
    q.addEventListener('input', (e)=>{
      const term = e.target.value;
      const items = filter(term);
      renderResults(items);

      // Optionally fit bounds to filtered items
      if(items.length){
        const fg = L.featureGroup(items.map(it => L.marker([it.lat, it.lng])));
        map.fitBounds(fg.getBounds().pad(0.25));
      }
    });
  });
})();
