# Práctica 8.5: arquitectura y flujo cliente-servidor

## GitHub Pages y CI/CD

El workflow `.github/workflows/pages.yml` ejecuta `npm ci`, las pruebas HTTP y la comprobación de sintaxis del cliente. En cada push a `main`, si pasan los controles, empaqueta únicamente `client/` y lo publica con GitHub Actions en Pages. Los pull requests ejecutan los controles sin desplegar.

En Settings → Pages → Build and deployment, seleccionar **GitHub Actions** como Source. La dirección prevista es https://brayton230406.github.io/DEMO-FLUJO/.

Pages solo aloja el cliente estático: muestra un aviso de configuración y no intenta llamar a localhost desde la página pública HTTPS. Para usar el catálogo y los pedidos, ejecutar localmente los pasos siguientes. Express, sus datos y las pruebas se conservan como código en el repositorio y no se incluyen en el artefacto público de Pages.

Implementación basada en «semana 8 teoria.pdf», desde 8.5.3 (página 25) hasta 8.5.8, con respuestas de la evaluación final.

## Ejecutar

Requiere Node.js 20 o posterior y npm. Desde esta carpeta:

```sh
npm install
npm start
```

En otra terminal, desde la misma carpeta:

```sh
npm run client
```

Abrir **http://localhost:5173**. La API funciona en **http://localhost:3000**. No abrir el HTML con doble clic: el cliente debe servirse por HTTP.

También puedes usar Live Server con **http://127.0.0.1:5500/client/index.html** o **http://localhost:5500/client/index.html**. En ese caso solo necesitas `npm start` para la API y Live Server para el cliente; no hace falta `npm run client`. Live Server no ejecuta Node.js: la API debe permanecer abierta en otra terminal. Si ya estaba ejecutándose antes de modificar CORS, detenla con Ctrl+C y vuelve a ejecutar `npm start`.

1. El catálogo carga los cuatro productos desde la API.
2. Agregar productos; agregar el mismo incrementa la cantidad.
3. Pulsar «Enviar pedido»; aparece el identificador y se vacía el carrito al recibir 201.
4. Recargar la página elimina el carrito porque solo vive en memoria.

## Estructura y responsabilidades (8.5.3–8.5.5)

```text
demo-flujo/
├── package.json
├── server/
│   ├── server.js               # Escucha en el puerto 3000
│   ├── app.js                  # Configuración Express, middleware y errores
│   ├── routes/
│   │   ├── productos.js
│   │   └── pedidos.js
│   ├── controllers/
│   │   ├── productos.controller.js
│   │   └── pedidos.controller.js
│   ├── middleware/
│   │   ├── cors.js
│   │   └── correlation.js
│   └── data/productos.json
├── client/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── scripts/client.js           # Servidor estático en 5173
└── test/api.test.js
```

- **Presentación:** HTML semántico, CSS responsivo y JavaScript con Fetch. Foco visible y estado `aria-live`. Los nombres se insertan con `textContent` para evitar interpretar HTML.
- **Lógica:** rutas, controladores y middleware Express. Las cantidades e identificadores deben ser enteros positivos.
- **Datos:** catálogo JSON, leído con ruta absoluta independiente del directorio de ejecución.
- **Observabilidad:** cada solicitud registra método, ruta y Correlation-ID. Se reutiliza el enviado o se genera uno, también en la respuesta.
- **CORS:** middleware propio del PDF; `cors` está instalado como alternativa de respaldo, sin ejecutar dos middlewares a la vez. Admite `localhost` y `127.0.0.1` en los puertos 5173 y 5500. Devuelve el origen solicitado si pertenece a esta lista. `CLIENT_ORIGIN` permite sustituir la lista por un origen específico.

Se separa `app.js` de `server.js` para probar la API en un puerto temporal. Correlación y CORS se ejecutan antes del parser para cubrir errores de JSON y preflight.

Los pedidos son simulados: no se guardan, no descuentan stock y no validan existencias contra el catálogo. El stock es informativo y el identificador de cuatro cifras puede repetirse, como en la práctica. No es una tienda con pagos reales.

## Pruebas (8.5.6)

```sh
npm test
curl -i http://localhost:3000/api/productos
curl -i -X POST http://localhost:3000/api/pedidos \
  -H 'Content-Type: application/json' \
  -H 'x-correlation-id: prueba-pedido-1' \
  -d '{"items":[{"id":1,"qty":2},{"id":3,"qty":1}]}'
curl -i -X OPTIONS http://localhost:3000/api/pedidos \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type,x-correlation-id'
curl -i -X POST http://localhost:3000/api/pedidos \
  -H 'Content-Type: application/json' -d '{"items":[]}'
```

Resultados esperados: GET → 200 con `status: "success"` y cuatro productos; POST válido → 201 con `status: "created"`, `orderId` e `items`; OPTIONS → 204; carrito vacío → 400.

En DevTools → Network, revisar `Content-Type`, `Access-Control-Allow-Origin` y `x-correlation-id`, estado 200/201, tiempo y tamaño de las respuestas. El ID del pedido debe coincidir con el log del servidor. Usar Tab para recorrer botones y comprobar el foco; con lector de pantalla, comprobar el anuncio del estado. En pantalla estrecha las tarjetas deben reorganizarse sin desbordar.

## Secuencia (8.5.7)

1. El navegador descarga HTML, CSS y JavaScript del servidor estático (5173).
2. `app.js` envía GET a la API (3000) con `x-correlation-id`.
3. El navegador realiza preflight OPTIONS cuando corresponde por la cabecera personalizada.
4. Express registra la solicitud, aplica CORS y dirige la petición al controlador.
5. El controlador lee `productos.json`, selecciona los campos y responde 200 JSON.
6. El cliente renderiza el catálogo y anuncia la carga mediante `aria-live`.
7. «Agregar» actualiza el carrito en memoria, sin petición al servidor.
8. «Enviar pedido» envía POST JSON con `{ items: [{ id, qty }] }`.
9. El servidor valida, simula la creación y devuelve 201 con el resumen.
10. El cliente anuncia el número del pedido y vacía el carrito.

## Errores frecuentes (8.5.8)

| Error | Causa y solución |
| --- | --- |
| CORS blocked | Los puertos 5173 y 5500 están contemplados para localhost y 127.0.0.1. Si usas otro origen, configurar `CLIENT_ORIGIN` con su origen real y reiniciar la API. |
| 404 | Comprobar rutas `/api/productos` y `/api/pedidos` y sus métodos. |
| 415 | Enviar `Content-Type: application/json`. |
| 400 | Revisar que el JSON sea válido y que `items` no esté vacío, con `id` y `qty` enteros positivos. |
| Error al interpretar JSON | Comprobar que la URL apunte a la API y no al servidor de HTML. |
| Error de red | Iniciar ambos servidores y verificar sus puertos. |

Ejemplo para Live Server:

```sh
CLIENT_ORIGIN=http://127.0.0.1:5500 npm start
```

Si cambias el puerto de la API con `PORT`, actualiza también la constante `API` en `client/app.js`.

## Evaluación final (páginas 36–37)

1. **El cliente solicita recursos al servidor, que responde mediante HTTP.** El cliente inicia el ciclo solicitud-respuesta.
2. **`app.use(express.json())` interpreta el cuerpo JSON y lo deja disponible en `req.body`.** Permite al controlador leer los datos del pedido.
3. **HTTPS cifra la comunicación y aporta privacidad y autenticidad.** Utiliza TLS y certificados digitales.
4. **La estructura modular separa rutas, controladores y datos, siguiendo el esquema MVC descrito en el material.** La separación facilita mantenimiento y escalabilidad.
