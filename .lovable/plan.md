

## Plan: Sincronizar Credenciales de Google OAuth

### Problema Identificado

Las credenciales de Google en Lovable Cloud no coinciden con las de Google Cloud Console:
- Login desde `adagiotest.lovable.app`: **Funciona**
- Login desde `app.adagioweb.com`: **Falla con invalid_client**

Esto indica que cuando cambiaste el Client Secret en Google Cloud Console, el valor que ingresaste en Lovable Cloud no es el correcto.

---

### Paso 1: Verificar el Tipo de OAuth Client en Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Navega a **APIs & Services** → **Credentials**
3. Haz clic en tu OAuth 2.0 Client ID
4. **Verifica que el tipo sea "Web application"** (no Android, iOS, etc.)

---

### Paso 2: Obtener las Credenciales Correctas

1. En la página del OAuth Client, copia el **Client ID** completo
   - Tiene formato: `xxxxx.apps.googleusercontent.com`
2. En la sección **Client secrets**:
   - Si ves varios secretos, **desactiva todos los antiguos**
   - Crea un **nuevo secreto** (botón "ADD SECRET")
   - **Copia el secreto INMEDIATAMENTE** (solo se muestra una vez)

---

### Paso 3: Actualizar Credenciales en Lovable Cloud

1. Abre el panel de backend de Lovable Cloud
2. Ve a **Users** → **Auth Settings** → **Google Settings**
3. **Borra los valores actuales** y pega los nuevos:
   - **Google Client ID**: El ID que copiaste (xxxxx.apps.googleusercontent.com)
   - **Google Client Secret**: El nuevo secreto que acabas de crear
4. **Guarda los cambios**

---

### Paso 4: Verificar URIs Autorizadas en Google

En Google Cloud Console, verifica que tienes estas URIs:

**Authorized JavaScript origins:**
```
https://app.adagioweb.com
https://adagiotest.lovable.app
```

**Authorized redirect URIs:**
```
https://tuozgcqmznlnwteodprx.supabase.co/auth/v1/callback
```

---

### Paso 5: Probar el Login

1. **Espera 3-5 minutos** para que los cambios se propaguen
2. **Abre una ventana de incógnito** (importante)
3. Accede a `https://app.adagioweb.com`
4. Intenta iniciar sesión con Google
5. Debería funcionar correctamente

---

### Alternativa: Usar OAuth Gestionado

Si prefieres no gestionar credenciales propias:

1. En Google Cloud Console, **desactiva o elimina** tu OAuth Client
2. En Lovable Cloud → Auth Settings → Google Settings:
   - **Deja ambos campos vacíos** (Client ID y Secret)
3. Lovable usará automáticamente sus propias credenciales gestionadas

---

### Resumen de Acciones

| Paso | Acción | Dónde |
|------|--------|-------|
| 1 | Verificar tipo = "Web application" | Google Cloud Console |
| 2 | Crear nuevo secreto y copiarlo | Google Cloud Console |
| 3 | Actualizar Client ID y Secret | Lovable Cloud → Auth Settings → Google |
| 4 | Verificar redirect URIs | Google Cloud Console |
| 5 | Probar en incógnito | app.adagioweb.com |

