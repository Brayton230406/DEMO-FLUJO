// Servidor estático local sin dependencias adicionales.
import express from 'express';
const app = express();
app.use(express.static(new URL('../client/', import.meta.url).pathname));
app.listen(5173, () => console.log('Cliente activo en http://localhost:5173'));
