

# Plan: Configurar OAuth de Google para Dominio Personalizado

## Problema
Cuando el usuario inicia sesión con Google desde `app.adagioweb.com`, el sistema redirige a la URL de Lovable (`adagiotest.lovable.app`) en lugar del dominio personalizado.

## Causa
Las URLs de redirección autorizadas en la configuración de autenticación no incluyen el dominio personalizado.

---

## Paso 1: Configurar URLs de Redirección en Lovable Cloud

1. Abre el panel de backend de Lovable Cloud
2. Ve a **Users** → **Auth Settings**
3. En la sección **Redirect URLs**, añade:
   - `https://app.adagioweb.com`
   - `https://app.adagioweb.com/auth/callback`
4. En **Site URL**, considera cambiarla a `https://app.adagioweb.com` si es tu dominio principal

---

## Paso 2: Configurar Google Cloud Console (si usas credenciales propias)

Si estás usando tus propias credenciales de Google OAuth (Client ID y Secret):

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Navega a **APIs & Services** → **Credentials**
3. Edita tu OAuth 2.0 Client ID
4. En **Authorized redirect URIs**, añade:
   - `https://tuozgcqmznlnwteodprx.supabase.co/auth/v1/callback`
5. Guarda los cambios

---

## Paso 3: Verificar Configuración

Después de realizar los cambios:

1. Espera 1-2 minutos para que los cambios se propaguen
2. Accede a `https://app.adagioweb.com`
3. Haz clic en "Iniciar sesión con Google"
4. Verifica que la redirección vuelva a `app.adagioweb.com`

---

## Notas Importantes

- El código actual usa `window.location.origin` correctamente, por lo que detectará automáticamente el dominio desde el que se accede
- El problema es puramente de configuración en el backend, no requiere cambios de código
- Si solo usas la autenticación gestionada por Lovable Cloud (sin credenciales propias de Google), solo necesitas completar el Paso 1

