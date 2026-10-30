import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../server/app.js';
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
test('GET productos: 200, JSON normalizado, CORS y correlación', async () => {
  const r = await fetch(`${base}/api/productos`, { headers: { Origin: 'http://localhost:5173', 'x-correlation-id': 'prueba-catalogo' } });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /application\/json/);
  assert.equal(r.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal(r.headers.get('x-correlation-id'), 'prueba-catalogo');
  const json = await r.json();
  assert.equal(json.status, 'success');
  assert.equal(json.data.length, 4);
  assert.deepEqual(Object.keys(json.data[0]), ['id', 'nombre', 'precio', 'stock']);
});
test('POST válido: 201 y resumen', async () => {
  const items = [{ id: 1, qty: 2 }, { id: 3, qty: 1 }];
  const r = await fetch(`${base}/api/pedidos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
  assert.equal(r.status, 201);
  const json = await r.json();
  assert.equal(json.status, 'created');
  assert.ok(Number.isInteger(json.orderId));
  assert.deepEqual(json.items, items);
});
test('POST inválidos: 400', async () => {
  for (const body of [{}, { items: [] }, { items: [null] }, { items: [{ id: 1, qty: 0 }] }, { items: [{ id: '1', qty: 2 }] }, { items: [{ id: 1, qty: 1.5 }] }]) {
    const r = await fetch(`${base}/api/pedidos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(r.status, 400);
  }
});
test('JSON mal formado: 400 con correlación; tipo incorrecto: 415', async () => {
  const r = await fetch(`${base}/api/pedidos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(r.status, 400);
  assert.ok(r.headers.get('x-correlation-id'));
  assert.equal((await r.json()).message, 'JSON inválido');
  const unsupported = await fetch(`${base}/api/pedidos`, { method: 'POST', body: 'texto' });
  assert.equal(unsupported.status, 415);
});
test('Preflight: 204 y cabeceras necesarias', async () => {
  const r = await fetch(`${base}/api/pedidos`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-correlation-id' } });
  assert.equal(r.status, 204);
  assert.match(r.headers.get('access-control-allow-methods'), /POST/);
  assert.match(r.headers.get('access-control-allow-headers'), /x-correlation-id/);
  assert.ok(r.headers.get('x-correlation-id'));
});
test('Ruta inexistente: 404 JSON', async () => {
  const r = await fetch(`${base}/no-existe`);
  assert.equal(r.status, 404);
  assert.equal((await r.json()).status, 'fail');
});

test('Live Server: preflight, catálogo y pedido con el origen de la captura', async () => {
  for (const origin of ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5173']) {
    const preflight = await fetch(`${base}/api/productos`, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'x-correlation-id' },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
    const catalogo = await fetch(`${base}/api/productos`, { headers: { Origin: origin } });
    assert.equal(catalogo.status, 200);
    assert.equal(catalogo.headers.get('access-control-allow-origin'), origin);
    assert.equal((await catalogo.json()).data.length, 4);
    const pedido = await fetch(`${base}/api/pedidos`, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: 1, qty: 2 }] }),
    });
    assert.equal(pedido.status, 201);
    assert.equal(pedido.headers.get('access-control-allow-origin'), origin);
  }
});

test('CORS no autoriza orígenes ajenos a la práctica', async () => {
  const r = await fetch(`${base}/api/productos`, { headers: { Origin: 'https://otro.example' } });
  assert.equal(r.headers.get('access-control-allow-origin'), null);
});
