import { Router } from 'express';
import { listarProductos } from '../controllers/productos.controller.js';
const router = Router();
router.get('/', listarProductos);
export default router;
