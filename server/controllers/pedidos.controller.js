import { randomInt } from 'node:crypto';

export function crearPedido(req, res) {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 'fail', message: 'Items inválidos (se requiere array con elementos)' });
  }
  if (items.some(it => !it || !Number.isSafeInteger(it.id) || it.id <= 0 ||
    !Number.isSafeInteger(it.qty) || it.qty <= 0)) {
    return res.status(400).json({ status: 'fail', message: 'Cada item debe tener id y qty enteros positivos' });
  }
  const orderId = randomInt(1000, 10000);
  const normalized = items.map(({ id, qty }) => ({ id, qty }));
  console.log(`[${req.correlationId}] Pedido creado #${orderId} con ${items.length} ítems`);
  res.status(201).json({ status: 'created', orderId, items: normalized });
}
