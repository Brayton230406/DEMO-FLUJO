import { readFile } from 'node:fs/promises';

const DATA_PATH = new URL('../data/productos.json', import.meta.url);
export async function listarProductos(req, res) {
  try {
    const data = JSON.parse(await readFile(DATA_PATH, 'utf8'));
    const out = data.map(({ id, nombre, precio, stock }) => ({ id, nombre, precio, stock }));
    res.status(200).json({ status: 'success', data: out });
  } catch (err) {
    console.error(`[${req.correlationId}] Error listando productos:`, err);
    res.status(500).json({ status: 'error', message: 'No se pudo leer el catálogo de productos' });
  }
}
