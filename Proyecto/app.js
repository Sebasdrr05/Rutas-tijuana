// === Mapa ===
const map = L.map('map').setView([32.5149, -117.0382], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let rutasGlobales = [];
let capasRutas = [];

fetch('data/rutas_actualizadas_con_40.json')
  .then(res => res.json())
  .then(data => {
    rutasGlobales = data;
    inicializarRutas(data);
  })
  .catch(err => console.error('Error al cargar rutas:', err));

function inicializarRutas(data) {
  mostrarTodasLasRutas(data);
  mostrarRutasDisponibles(data);
  llenarSelectRutas(data);
  document.getElementById("rutasCantidad").textContent = `🔢 Total de rutas disponibles: ${data.length}`;
}

function colorPorTipo(tipo) {
  return {
    camion: 'blue',
    calafia: 'green',
    taxi: 'orange'
  }[tipo] || 'gray';
}

function emojiPorTipo(tipo) {
  return {
    camion: '🚌',
    calafia: '🚐',
    taxi: '🚕'
  }[tipo] || '❓';
}

function limpiarMapa() {
  capasRutas.forEach(capa => map.removeLayer(capa));
  capasRutas = [];
}

function limpiarLista() {
  document.getElementById("rutasLista").innerHTML = "";
  document.getElementById("listaParadas").innerHTML = "";
  document.getElementById("mensajeParadas").style.display = "block";
}

function agregarRutaALaLista(ruta) {
  const lista = document.getElementById("rutasLista");
  const li = document.createElement("li");
  li.className = "ruta-item";
  li.innerHTML = `${emojiPorTipo(ruta.tipo)} <strong>${ruta.nombre}</strong> — $${ruta.precio} (${ruta.tipo})`;

  li.addEventListener("click", () => {
    centrarEnPrimeraParada(ruta);
    mostrarDetalleParadas(ruta);
  });

  lista.appendChild(li);
}

function centrarEnPrimeraParada(ruta) {
  const p = ruta.paradas[0];
  map.setView([p.lat, p.lng], 14);
  L.popup()
    .setLatLng([p.lat, p.lng])
    .setContent(`<strong>${ruta.nombre}</strong><br>Primera parada: ${p.nombre}`)
    .openOn(map);
}

function mostrarDetalleParadas(ruta) {
  const lista = document.getElementById("listaParadas");
  lista.innerHTML = "";
  document.getElementById("mensajeParadas").style.display = "none";
  ruta.paradas.forEach(parada => {
    const li = document.createElement("li");
    li.textContent = parada.nombre;
    lista.appendChild(li);
  });
}

function dibujarRutaEnMapa(ruta) {
  const color = colorPorTipo(ruta.tipo);
  const puntos = ruta.paradas.map(p => [p.lat, p.lng]);
  const linea = L.polyline(puntos, { color, weight: 5 }).addTo(map);
  capasRutas.push(linea);

  ruta.paradas.forEach(parada => {
    const marcador = L.marker([parada.lat, parada.lng])
      .addTo(map)
      .bindPopup(`${emojiPorTipo(ruta.tipo)} <b>${parada.nombre}</b><br>Ruta: ${ruta.nombre}<br>Tipo: ${ruta.tipo}<br>Precio: $${ruta.precio}`);
    capasRutas.push(marcador);
  });
}

function mostrarTodasLasRutas(data) {
  limpiarMapa();
  limpiarLista();
  data.forEach(ruta => {
    dibujarRutaEnMapa(ruta);
    agregarRutaALaLista(ruta);
  });
}

function buscarRuta() {
  const destino = document.getElementById('destinoInput').value.trim().toLowerCase();
  if (!destino) return alert('Escribe un destino');

  const resultados = rutasGlobales.filter(ruta =>
    ruta.paradas.some(p => p.nombre.toLowerCase().includes(destino))
  );

  limpiarMapa();
  limpiarLista();

  if (resultados.length === 0) {
    alert('No se encontraron rutas para ese destino');
    mostrarTodasLasRutas(rutasGlobales);
  } else {
    resultados.forEach(ruta => {
      dibujarRutaEnMapa(ruta);
      agregarRutaALaLista(ruta);
    });
    alert(`Se encontraron ${resultados.length} ruta(s)`);
  }
}

function limpiarBusqueda() {
  document.getElementById('destinoInput').value = "";
  mostrarTodasLasRutas(rutasGlobales);
}

function filtrarPorTipo() {
  const tipo = document.getElementById('filtroTipo').value;
  const filtradas = tipo ? rutasGlobales.filter(r => r.tipo === tipo) : rutasGlobales;
  mostrarTodasLasRutas(filtradas);
}

function mostrarRutasDisponibles(rutas) {
  const contenedor = document.getElementById("rutasCards");
  contenedor.innerHTML = "";

  rutas.forEach((ruta, index) => {
    const card = document.createElement("div");
    card.className = `ruta-card ${ruta.tipo}`;
    card.innerHTML = `
      <h4>${emojiPorTipo(ruta.tipo)} ${ruta.nombre}</h4>
      <p><strong>Tipo:</strong> ${ruta.tipo}</p>
      <p><strong>Precio:</strong> $${ruta.precio}</p>
      <p><strong>Paradas:</strong> ${ruta.paradas.length}</p>
      <button onclick="verRuta(${index})">Ver en el mapa</button>
    `;
    contenedor.appendChild(card);
  });
}

function verRuta(index) {
  const ruta = rutasGlobales[index];
  limpiarMapa();
  limpiarLista();
  mostrarDetalleParadas(ruta);
  dibujarRutaEnMapa(ruta);
  centrarEnPrimeraParada(ruta);
}

function llenarSelectRutas(rutas) {
  const select = document.getElementById("selectRuta");
  rutas.forEach((ruta, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${emojiPorTipo(ruta.tipo)} ${ruta.nombre}`;
    select.appendChild(option);
  });
}

function mostrarRutaSeleccionada() {
  const index = document.getElementById("selectRuta").value;
  const cargando = document.getElementById("cargandoRuta");
  if (index === "") return;

  cargando.style.display = "block";

  setTimeout(() => {
    verRuta(index);
    cargando.style.display = "none";
  }, 300);
}

