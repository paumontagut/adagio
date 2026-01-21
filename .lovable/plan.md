

## Plan: Solucionar Error "invalid_client" en Google OAuth

### Diagnóstico del Problema

El error `oauth2: "invalid_client" "Unauthorized"` ocurre porque:

1. **Tienes credenciales personalizadas de Google** configuradas en Google Cloud Console
2. **Pero el backend de Lovable Cloud no tiene esos secretos configurados**, por lo que está usando credenciales gestionadas automáticamente que no coinciden con tu configuración de Google

### Observaciones de las Capturas

| Elemento | Estado |
|----------|--------|
| Site URL en Lovable | Correcto: `https://app.adagioweb.com` |
| Redirect URLs | Correcto |
| Callback en Google Console | `https://tuozgcqmznlnwteodprx.supabase.co/auth/v1/callback` - Correcto |
| Dos secretos activos en Google | Problema potencial - deberías tener solo uno |

---

### Opción A: Usar Credenciales de Google Personalizadas (Recomendado)

Si quieres mantener tu configuración actual de Google Cloud Console:

**Paso 1: Obtener las credenciales correctas**
1. Ve a [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Haz clic en tu OAuth 2.0 Client ID
3. Copia el **Client ID** (el ID completo, no el nombre)
4. Crea un **nuevo secreto** o copia uno existente (solo puedes ver el secreto al crearlo)

**Paso 2: Configurar en Lovable Cloud**
1. Abre el panel de backend (usando el botón "Abrir Backend" abajo)
2. Ve a **Users** → **Auth Settings** → **Google Settings**
3. Ingresa:
   - **Google Client ID**: Tu ID de cliente de Google
   - **Google Client Secret**: Tu secreto de cliente
4. Guarda los cambios

**Paso 3: Limpiar secretos duplicados en Google**
1. En Google Cloud Console, ve a tu OAuth Client
2. En "Secretos del cliente", **inhabilita el secreto antiguo** (****M8uj del 29 de agosto)
3. Mantén solo el secreto más reciente (****Q40s del 20 de enero)

---

### Opción B: Usar OAuth Gestionado por Lovable (Más Simple)

Si prefieres que Lovable gestione las credenciales automáticamente:

**Paso 1: Eliminar configuración personalizada**
1. Ve a Google Cloud Console y **borra o desactiva** el OAuth Client que creaste
2. No necesitas configurar Client ID/Secret en Lovable

**Paso 2: Verificar configuración en Lovable Cloud**
1. Ve a **Users** → **Auth Settings** → **Google Settings**
2. **Deja vacíos** los campos de Client ID y Client Secret
3. Lovable usará sus propias credenciales

---

### Paso de Verificación (para ambas opciones)

Después de hacer los cambios:

1. **Espera 2-3 minutos** para que los cambios se propaguen
2. **Abre una ventana de incógnito** (importante para limpiar cookies)
3. Accede a `https://app.adagioweb.com`
4. Intenta iniciar sesión con Google
5. Verifica que funcione correctamente

---

### Resumen de Acciones

| Prioridad | Acción | Dónde |
|-----------|--------|-------|
| Alta | Configurar Google Client ID y Secret | Lovable Cloud → Auth Settings → Google |
| Media | Eliminar secreto duplicado | Google Cloud Console → Credentials |
| Verificación | Probar login en incógnito | app.adagioweb.com |

