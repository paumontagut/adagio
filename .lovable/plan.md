

## Diagnóstico del 404 antes de llegar a Google

Viendo tus capturas, la configuración de Google Cloud Console y Lovable Cloud se ve correcta. El 404 ocurre **antes** de que Google abra, lo que indica que el problema es la configuración de **Redirect URLs** en los ajustes de autenticación del backend.

### Problema

Cuando `supabase.auth.signInWithOAuth` se ejecuta desde `https://app.adagioweb.com`, envía como `redirect_to` la URL `https://app.adagioweb.com/auth/callback`. Si esta URL no esta en la lista de **Redirect URLs permitidas** en la configuración de autenticacion del backend, la peticion falla con 404.

### Lo que hay que hacer

#### 1. Añadir tu dominio a las Redirect URLs del backend

En la configuracion de autenticacion del backend (Cloud -> Auth -> URL Configuration):

- **Site URL**: `https://app.adagioweb.com`
- **Redirect URLs**: añadir `https://app.adagioweb.com/**`

Esto es lo que falta para que el flujo OAuth funcione desde tu dominio.

#### 2. Configurar Nginx para SPA (responde a tu pregunta "donde añado eso")

En tu archivo de configuracion de Nginx (normalmente `/etc/nginx/sites-available/tu-sitio` o `/etc/nginx/conf.d/adagio.conf`), dentro del bloque `server` existente. Ejemplo completo:

```text
server {
    listen 80;
    server_name app.adagioweb.com;

    root /ruta/a/tu/carpeta/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

La linea clave es `try_files $uri $uri/ /index.html;` — esto hace que cualquier ruta como `/auth`, `/auth/callback`, `/privacy-center`, etc., sirva el `index.html` en lugar de devolver 404. Sin esto, Nginx busca archivos reales para cada ruta y no los encuentra.

Si ya tienes un bloque `server` para tu sitio, solo necesitas asegurarte de que el `location /` contenga esa linea `try_files`.

#### 3. No hay cambios de codigo necesarios

El codigo actual ya tiene la estrategia dual correcta (Lovable Auth en `*.lovable.app`, Supabase Auth directo en dominios externos). No necesita modificaciones.

### Resumen de acciones

| Accion | Donde |
|--------|-------|
| Añadir `https://app.adagioweb.com/**` a Redirect URLs | Cloud -> Auth -> URL Configuration |
| Añadir `try_files $uri $uri/ /index.html;` | Archivo de config Nginx del servidor |
| Reiniciar Nginx: `sudo nginx -t && sudo systemctl reload nginx` | Terminal del servidor |

