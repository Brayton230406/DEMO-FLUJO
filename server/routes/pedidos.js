import { Router } from 'express';
import { crearPedido } from '../controllers/pedidos.controller.js';
const router = Router();
router.post('/', (req, res, next) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ status: 'fail', message: 'Se requiere Content-Type: application/json' });
  }
  next();
}, crearPedido);
export default router;
