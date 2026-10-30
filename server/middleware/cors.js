// CORS propio para observar las cabeceras y la petición preflight.
export function setupCORS(allowedOrigin) {
  // Orígenes de los clientes usados en la práctica: servidor local y Live Server.
  // CLIENT_ORIGIN, cuando se define, sustituye esta lista.
  const allowedOrigins = allowedOrigin ? [allowedOrigin] : [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ];
  return (req, res, next) => {
    const origin = req.get('Origin');
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.vary('Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-correlation-id');
    res.setHeader('Access-Control-Expose-Headers', 'x-correlation-id');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  };
}
