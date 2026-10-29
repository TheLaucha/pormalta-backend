# Pormalta Backend

Backend serverless desplegado en Netlify Functions. Requiere Node.js 18 o
superior y npm.

## Ejecutar localmente

1. Instala las dependencias desde la carpeta del proyecto:

   ```powershell
   npm ci
   ```

2. Crea o completa el archivo `.env` en la raíz del proyecto. No compartas ni
   subas este archivo: contiene credenciales y está excluido de Git.

   ```dotenv
   # Galería de Bunny
   BUNNY_STORAGE_ZONE=
   BUNNY_GALLERY_API_KEY=

   # Envío de correo con Gmail (usa una contraseña de aplicación)
   MAIL_USERNAME=
   APP_PASSWORD=

   # Reseñas en Sanity
   SANITY_PROJECT_ID=
   SANITY_DATASET=production
   SANITY_API_TOKEN=

   # Se requiere para conceder el beneficio de videos a una reseña con
   # puntuación de 9 o 10
   BUNNY_API_KEY=
   ```

   Para Sanity también se acepta `SANITY_TOKEN` en lugar de
   `SANITY_API_TOKEN`. `SANITY_DATASET` es opcional; si se omite, se usa
   `production`.

3. Inicia Netlify Dev:

   ```powershell
   npm run dev
   ```

   Netlify muestra la URL local al iniciar (normalmente
   `http://localhost:8888`). `npm start` inicia el mismo servidor.

## Endpoints

Todos los endpoints se sirven mediante la función
`/.netlify/functions/api`:

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/.netlify/functions/api` | Obtiene la galería de Bunny |
| `POST` | `/.netlify/functions/api/sendEmail` | Envía un correo |
| `GET` | `/.netlify/functions/api/tour-reviews/tours` | Lista tours publicados |
| `POST` | `/.netlify/functions/api/tour-reviews` | Crea una reseña |

Para crear una reseña envía JSON con `email`, `comment`, `tourId` y `score`
(entero de 1 a 10). Las reseñas de puntuación 9 o 10 también requieren
`BUNNY_API_KEY` para conceder el acceso a videos.

Ejemplo de solicitud para crear una reseña:

```powershell
$body = @{
  email   = "persona@example.com"
  comment = "Muy buen tour"
  tourId  = "ID_DEL_TOUR_EN_SANITY"
  score   = 10
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8888/.netlify/functions/api/tour-reviews" `
  -ContentType "application/json" `
  -Body $body
```

## Build y deploy a Netlify

1. Inicia sesión en Netlify y vincula este directorio a un sitio existente, o
   crea uno nuevo:

   ```powershell
   npx netlify login
   npx netlify link
   ```

   Si todavía no hay un sitio creado, usa `npx netlify init` y sigue las
   indicaciones.

2. Configura las mismas variables de entorno en la configuración del sitio en
   Netlify. No es necesario ni seguro subir `.env`.

3. Publica el deploy de producción:

   ```powershell
   npm run deploy
   ```

   `npm run deploy` ejecuta el build antes de publicar. Para validar el build
   localmente por separado, ejecuta `npm run build` después de vincular el sitio.
   La carpeta de funciones está configurada como `functions` en
   [netlify.toml](./netlify.toml).

Después del deploy, reemplaza `http://localhost:8888` por el dominio asignado
por Netlify y conserva las rutas indicadas en la tabla de endpoints.
