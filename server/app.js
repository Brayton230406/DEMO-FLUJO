import express from 'express';
import productos from './routes/productos.js';
import pedidos from './routes/pedidos.js';
import { setupCORS } from './middleware/cors.js';
import { correlation } from './middleware/correlation.js';

export const app = express();
// Correlación y CORS antes del parser: cubren también preflight y JSON inválido.
app.use(correlation);
app.use(setupCORS(process.env.CLIENT_ORIGIN));
app.use(express.json({ limit: '32kb' }));
app.get('/', (req, res) => res.status(200).send('API Demo Flujo Cliente-Servidor ✅'));
app.use('/api/productos', productos);
app.use('/api/pedidos', pedidos);
app.use((req, res) => res.status(404).json({ status: 'fail', message: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  const code = err.status === 400 ? 400 : err.status === 413 ? 413 : 500;
  console.error(`[${req.correlationId}] ${err.message}`);
  res.status(code).json({ status: 'error', message: code === 400 ? 'JSON inválido' : code === 413 ? 'Solicitud demasiado grande' : 'Error interno del servidor' });
});
