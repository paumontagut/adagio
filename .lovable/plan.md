

## Diagnóstico: Google Auth 404 en despliegue propio

### Problema raíz

El proyecto usa `@lovable.dev/cloud-auth-js` (la librería `lovable.auth.signInWithOAuth`) para el flujo OAuth con Google. Esta librería **solo funciona dentro del ecosistema de Lovable** (dominios `*.lovable.app` y dominios personalizados configurados en Lovable Cloud). 

Cuando descargas la carpeta `dist` y la subes a tu propio servidor, la librería intenta redirigir a endpoints de Lovable Cloud (`/~oauth` o similares) que **no existen en tu servidor**, provocando el 404.

Además, hay un segundo problema: al ser una SPA (Single Page Application) con React Router, cualquier ruta que no sea `/` (por ejemplo `/auth`, `/auth/callback`) devuelve 404 si el servidor web no está configurado para redirigir todas las rutas a `index.html`.

### Dos problemas distintos

1. **SPA routing**: Tu servidor necesita configurarse para servir `index.html` en todas las rutas. Sin esto, cualquier URL como `/auth` da 404.

2. **Lovable Cloud Auth**: La librería `@lovable.dev/cloud-auth-js` depende de la infraestructura de Lovable. No funciona en servidores externos. Para que Google OAuth funcione fuera de Lovable, necesitas usar directamente `supabase.auth.signInWithOAuth()` con tus propias credenciales de Google OAuth (Client ID y Secret configurados en Google Cloud Console y en tu proyecto Supabase).

### Plan de solución

#### Paso 1 — Configurar SPA fallback en tu servidor
Dependiendo de tu servidor:
- **Nginx**: añadir `try_files $uri $uri/ /index.html;`
- **Apache**: añadir un `.htaccess` con `FallbackResource /index.html`
- **Vercel/Netlify**: crear `vercel.json` o `_redirects` con rewrite a `/index.html`

#### Paso 2 — Reemplazar Lovable Auth por Supabase Auth directo
Modificar `src/contexts/AuthContext.tsx` y `src/pages/Auth.tsx` para usar `supabase.auth.signInWithOAuth('google', ...)` directamente en lugar de `lovable.auth.signInWithOAuth`.

Esto requiere:
- Configurar un proyecto Google OAuth en Google Cloud Console
- Añadir el Client ID y Secret en los Auth Settings de tu proyecto Supabase (o Lovable Cloud)
- Configurar la redirect URL de tu dominio personalizado en Google Cloud Console y en Supabase

#### Paso 3 — Configurar Redirect URLs
En la configuración de Auth de Supabase/Lovable Cloud:
- **Site URL**: `https://app.adagioweb.com` (o tu dominio)
- **Redirect URLs**: añadir `https://app.adagioweb.com/**`

### Pregunta clave

¿Estás desplegando en `app.adagioweb.com` o en otro dominio/servidor? Y ¿qué servidor web usas (Nginx, Apache, otro)? Esto determina la configuración exacta del SPA fallback y las redirect URLs.

