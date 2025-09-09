
// v6 — WA button fix + cache-busting + WA in map popups
const STATE_ANY="__any_state__",CITY_ANY="__any_city__";
let CENTERS=[], MAP_POINTS=[], map, markersLayer;

function $(s){ return document.querySelector(s); }
function createEl(tag, attrs={}, children=[]){
  const el = document.createElement(tag);
  Object.entries(attrs||{}).forEach(([k,v])=>{
    if(k==="class") el.className=v;
    else if(k==="html") el.innerHTML=v;
    else el.setAttribute(k,v);
  });
  (Array.isArray(children)?children:[children]).filter(Boolean).forEach(c=>el.appendChild(c));
  return el;
}

async function loadData(){
  const resCenters = await fetch('assets/data/centers.json', {cache:'no-store'});
  CENTERS = await resCenters.json().catch(()=>[]);
  const resMap = await fetch('assets/data/map_points.json', {cache:'no-store'});
  MAP_POINTS = await resMap.json().catch(()=>[]);

  initFilters();
  initMap();
  applyFilters();
  populateMarkers(MAP_POINTS);
}

function initMap(){
  map = L.map('map', { scrollWheelZoom:false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  map.setView([19.0415805, -98.1415156], 12);
}

function bbIcon(){
  const html = `<div class="bb-pin" style="background-image:url('assets/img/bb-logo.png'), linear-gradient(135deg,#2FA19E,#1f7f7d)"></div>`;
  return L.divIcon({ className:'bb-marker', html, iconSize:[32,32], iconAnchor:[16,16] });
}

function waUrlFor(name, city, state){
  // MX (+52) 222 577 3967
  const WA_NUMBER = '522225773967';
  const msg = encodeURIComponent(`Hola, me gustaría solicitar información de productos. Sucursal: ${name || ''}${city? ', '+city:''}${state? ', '+state:''}`);
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}

function populateMarkers(points){
  markersLayer.clearLayers();
  const bounds = [];
  (points||[]).forEach(p=>{
    if(typeof p.lat!=='number' || typeof p.lng!=='number') return;
    const name = p.name || 'Sucursal';
    const wa = waUrlFor(name, '', '');
    const popup = `<strong>${name}</strong><br>
      <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">
        ${p.gmaps ? `<a class="btn btn-map" href="${p.gmaps}" target="_blank" rel="noopener">Ver mapa</a>` : ''}
        <a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
      </div>`;
    const m = L.marker([p.lat,p.lng], {icon: bbIcon()}).bindPopup(popup);
    markersLayer.addLayer(m);
    bounds.push([p.lat,p.lng]);
  });
  if(bounds.length===1) map.setView(bounds[0], 14);
  else if(bounds.length>1) map.fitBounds(bounds, {padding:[30,30]});
}

function unique(list, get){
  const vals = new Set();
  (list||[]).forEach(x => vals.add(get(x)));
  return [...vals].filter(Boolean).sort((a,b)=>`${a}`.localeCompare(`${b}`,'es'));
}

function getName(c){ return c?.name || c?.nombre || ''; }
function getState(c){ return c?.state || c?.estado || ''; }
function getCity(c){ return c?.city || c?.ciudad || ''; }
function getAddress(c){ return c?.address || c?.direccion || ''; }
function getPhone(c){ return c?.phone || c?.tel || ''; }

function initFilters(){
  const selE = $('#estado');
  const selC = $('#ciudad');

  const estados = unique(CENTERS, getState);
  selE.innerHTML = `<option value="${STATE_ANY}">Todos los estados</option>` + estados.map(e=>`<option value="${e}">${e}</option>`).join('');

  const refreshCities = ()=>{
    const est = selE.value;
    const cities = unique(CENTERS.filter(c=> est===STATE_ANY || getState(c)===est), getCity);
    selC.innerHTML = `<option value="${CITY_ANY}">Todas las ciudades</option>` + cities.map(c=>`<option value="${c}">${c}</option>`).join('');
    selC.value = CITY_ANY;
  };
  refreshCities();

  selE.addEventListener('change', ()=>{ refreshCities(); applyFilters(); });
  selC.addEventListener('change', applyFilters);
  $('#q').addEventListener('input', debounce(applyFilters, 150));
}

function applyFilters(){
  const state = $('#estado').value;
  const city = $('#ciudad').value;
  const q = $('#q').value.trim().toLowerCase();

  const filtered = (CENTERS||[]).filter(c=>{
    const okE = (state===STATE_ANY) || (getState(c)===state);
    const okC = (city===CITY_ANY) || (getCity(c)===city);
    const text = `${getName(c)} ${getCity(c)} ${getState(c)} ${getAddress(c)} ${getPhone(c)}`.toLowerCase();
    const okQ = !q || text.includes(q);
    return okE && okC && okQ;
  });

  renderResults(filtered);
}

function renderResults(list){
  const cont = $('#resultados');
  cont.innerHTML = '';
  if(!list.length){
    cont.appendChild(createEl('div',{class:'card'},[
      createEl('h4',{html:'Sin resultados'}),
      createEl('p',{html:'Intenta cambiar los filtros o escribe otra búsqueda.'})
    ]));
    return;
  }

  list.forEach(c=>{
    const nombre = getName(c) || 'Sucursal';
    const ciudad = getCity(c);
    const estado = getState(c);

    const btns = createEl('div',{class:'btn-row'});
    const q = encodeURIComponent(`${nombre} ${ciudad} ${estado}`.trim());
    const gmaps = `https://www.google.com/maps/search/?api=1&query=${q}`;
    btns.appendChild(createEl('a',{class:'btn btn-map', href:gmaps, target:'_blank', rel:'noopener', html:'Ver mapa'}));

    const wa = waUrlFor(nombre, ciudad, estado);
    btns.appendChild(createEl('a',{class:'btn btn-wa', href:wa, target:'_blank', rel:'noopener', html:'Pedir por WhatsApp'}));

    const badges = createEl('div',{class:'badges'},[
      estado ? createEl('span',{class:'badge', html:estado}) : null,
      ciudad ? createEl('span',{class:'badge', html:ciudad}) : null
    ]);

    const card = createEl('div',{class:'card'},[
      createEl('h4',{html: nombre}),
      getAddress(c) ? createEl('p',{html:`<strong>Dirección:</strong> ${getAddress(c)}`}) : null,
      getPhone(c) ? createEl('p',{html:`<strong>Tel:</strong> ${getPhone(c)}`}) : null,
      badges,
      btns
    ]);
    cont.appendChild(card);
  });
}

function debounce(fn, ms){
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(null,args), ms); };
}

document.addEventListener('DOMContentLoaded', loadData);


// ===== Header interactions + to-top =====
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.bb-header');
  const btnMenu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('bb-nav');
  const toTop = document.querySelector('.to-top');

  // Shadow on scroll
  window.addEventListener('scroll', () => {
    if(window.scrollY > 4) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    if(window.scrollY > 300) toTop.classList.add('show'); else toTop.classList.remove('show');
  });

  // Mobile menu toggle
  if(btnMenu){
    btnMenu.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btnMenu.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // To top
  if(toTop){
    toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  }
});
