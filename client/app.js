const API = 'http://localhost:3000';
const catalogo = document.querySelector('#catalogo');
const carritoUL = document.querySelector('#carrito');
const statusEl = document.querySelector('#status');
const btnEnviar = document.querySelector('#enviar');
const recargar = document.querySelector('#recargar');
let carrito = [];
let enviando = false;
const dinero = n => `$${n.toFixed(2)}`;
const cid = () => `cid-${crypto.randomUUID()}`;
const announce = msg => { statusEl.textContent = msg; };

async function init() {
  announce('Cargando productos...');
  recargar.hidden = true;
  try {
    const res = await fetch(`${API}/api/productos`, { headers: { 'x-correlation-id': cid() } });
    if (!res.ok) throw new Error('No se pudo obtener el catálogo');
    const json = await res.json();
    renderCatalogo(json.data);
    announce('Productos cargados');
  } catch (e) {
    announce('No se pudo cargar el catálogo. Ejecuta npm start en la carpeta demo-flujo y comprueba CORS si usas otro origen. Después pulsa Reintentar carga.');
    recargar.hidden = false;
    console.error(e);
  }
}
function renderCatalogo(items) {
  catalogo.replaceChildren();
  for (const p of items) {
    // textContent evita interpretar los nombres del catálogo como HTML.
    const article = document.createElement('article');
    article.className = 'card';
    const title = document.createElement('h3');
    title.textContent = p.nombre;
    const price = document.createElement('p');
    price.textContent = `Precio: ${dinero(p.precio)}`;
    const stock = document.createElement('p');
    stock.textContent = `Stock: ${p.stock}`;
    const button = document.createElement('button');
    button.textContent = 'Agregar';
    button.setAttribute('aria-label', `Agregar ${p.nombre} al carrito`);
    button.addEventListener('click', () => {
      if (enviando) return;
      const item = carrito.find(i => i.id === p.id);
      if (item) item.qty += 1;
      else carrito.push({ id: p.id, nombre: p.nombre, precio: p.precio, qty: 1 });
      renderCart();
      announce(`${p.nombre} agregado al carrito`);
    });
    article.append(title, price, stock, button);
    catalogo.append(article);
  }
}
function renderCart() {
  carritoUL.replaceChildren();
  for (const i of carrito) {
    const li = document.createElement('li');
    li.textContent = `${i.nombre} — ${dinero(i.precio)} × ${i.qty}`;
    carritoUL.append(li);
  }
  document.querySelector('#vacio').hidden = carrito.length > 0;
  document.querySelector('#total').textContent = dinero(carrito.reduce((sum, i) => sum + i.precio * i.qty, 0));
}
btnEnviar.addEventListener('click', async () => {
  if (enviando) return;
  if (!carrito.length) return announce('El carrito está vacío');
  enviando = true;
  btnEnviar.disabled = true;
  catalogo.querySelectorAll('button').forEach(b => { b.disabled = true; });
  const items = carrito.map(({ id, qty }) => ({ id, qty }));
  announce('Enviando pedido...');
  try {
    const res = await fetch(`${API}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-correlation-id': cid() },
      body: JSON.stringify({ items })
    });
    const json = await res.json();
    if (res.status === 201) {
      carrito = [];
      renderCart();
      announce(`Pedido creado (#${json.orderId})`);
    } else announce(json.message || 'No se pudo crear el pedido');
  } catch (e) {
    announce('Error de red al enviar pedido. El carrito se conserva.');
    console.error(e);
  } finally {
    enviando = false;
    btnEnviar.disabled = false;
    catalogo.querySelectorAll('button').forEach(b => { b.disabled = false; });
  }
});
recargar.addEventListener('click', init);
if (location.hostname.endsWith('.github.io')) {
  document.querySelector('#aviso-pages').hidden = false;
  btnEnviar.disabled = true;
  announce('Cliente publicado en GitHub Pages. Consulta la configuración para ejecutar la práctica localmente.');
} else {
  init();
}
