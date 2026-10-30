import { randomUUID } from 'node:crypto';

export function correlation(req, res, next) {
  const id = req.get('x-correlation-id') || `cid-${randomUUID()}`;
  req.correlationId = id;
  res.setHeader('x-correlation-id', id);
  console.log(`[${id}] ${req.method} ${req.originalUrl}`);
  next();
}
