
(function(){
  const MAP_ID = 'branchMap';
  const PANEL_ID = 'branchPanel';
  const LIST_ID = 'branchList';
  const SEARCH_ID = 'branchSearch';
  const DATA_URL = 'assets/data/center.json'; // alias to centers.json
  const WHATSAPP_NUM = '522225773967'; // +52 country code // country code + MX number

  // Custom icon
  const bbIcon = L.icon({
    iconUrl: 'assets/img/markers/bb_marker.png',
    iconSize: [36,36],
    iconAnchor: [18,36],
    popupAnchor: [0,-28]
  });

  const map = L.map(MAP_ID, { scrollWheelZoom: false });
  const layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  let markers = [];
  let data = [];
  const panel = document.getElementById(PANEL_ID);
  const list = document.getElementById(LIST_ID);
  const q = document.getElementById(SEARCH_ID);

  function whatsappLink(item){
    const msg = `Hola, quiero información de la sucursal: ${item.name} - ${item.address}. Link: ${item.maps}`;
    return `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`;
  }

  
  function cardHTML(item){
    return `
      <div class="branch-card">
        <div class="branch-card-body">
          <h3 class="branch-title">${item.name}</h3>
          <p class="branch-address">${item.address || ''}</p>
          <div class="branch-actions">
            <a class="btn btn-whatsapp" target="_blank" href="${whatsappLink(item)}">WhatsApp</a>
            <a class="btn btn-outline" target="_blank" href="${item.maps}">Abrir en Maps</a>
            <button class="btn btn-ghost" data-copy="${item.address || ''}">Copiar dirección</button>
          </div>
        </div>
      </div>
    `;
  }
function renderList(items){
    list.innerHTML = items.map((it, idx)=> `<button class="branch-item" data-idx="${idx}">${it.name}</button>`).join('');
  }

  function focusItem(idx){
    const it = data[idx];
    if(!it) return;
    const m = markers[idx];
    if(m){ 
      map.flyTo([it.lat, it.lng], 15, {animate:true, duration: .6});
      setTimeout(()=> m.openPopup(), 650);
    }
    panel.innerHTML = cardHTML(it);
    const copyBtn = panel.querySelector('[data-copy]');
    if(copyBtn){
      copyBtn.addEventListener('click', ()=> {
        const txt = copyBtn.getAttribute('data-copy') || '';
        navigator.clipboard?.writeText(txt);
        copyBtn.textContent = 'Copiado';
        setTimeout(()=> copyBtn.textContent='Copiar dirección', 1200);
      });
    }
  }

  function filter(term){
    term = term.trim().toLowerCase();
    const items = !term ? data : data.filter(d=> 
      (d.name||'').toLowerCase().includes(term) ||
      (d.address||'').toLowerCase().includes(term)
    );
    renderList(items);
    // bind list buttons to their original indices
    Array.from(list.querySelectorAll('.branch-item')).forEach(btn=>{
      const name = btn.textContent;
      const idx = data.findIndex(d=> d.name===name);
      btn.addEventListener('click', ()=> focusItem(idx));
    });
  }

  fetch(DATA_URL, {cache:'no-store'}).then(r=> r.json()).then(json=>{
    data = json;
    const group = L.featureGroup();
    data.forEach((it, idx)=>{
      const marker = L.marker([it.lat, it.lng], {icon: bbIcon})
        .bindPopup(`<strong>${it.name}</strong><br>${it.address||''}`)
        .on('click', ()=> { panel.innerHTML = cardHTML(it); });
      marker.addTo(group);
      markers.push(marker);
    });
    group.addTo(map);
    map.fitBounds(group.getBounds().pad(0.2));

    // Initial panel and list
    panel.innerHTML = cardHTML(data[0]);
    renderList(data);
    Array.from(list.querySelectorAll('.branch-item')).forEach((btn,i)=> btn.addEventListener('click', ()=> focusItem(i)));
  });

  // Search
  q.addEventListener('input', (e)=> filter(e.target.value));
})();
