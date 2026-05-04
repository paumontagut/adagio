## Objetivo

Que cada vez que uses el apartado **Transcribir** se guarde:
1. El **audio** original que grabaste/subiste.
2. El **texto transcrito** por el motor (Adagio o ChatGPT).
3. El **proveedor** usado.
4. Y que cuando des feedback ("Sí correcto" / "No, era esto otro"), el registro se **actualice** con el texto final corregido, sin crear duplicados.

Todo esto va en un **espacio separado** del entrenamiento (no toca `audio_metadata`, `audio_raw` ni `recordings`).

---

## Dónde se guarda

### Storage
- **Bucket nuevo `transcripciones`** (privado), separado de `audio_raw` (entrenamiento) y de `inferencias` (feedback antiguo).
- Ruta: `{user_id}/{transcription_id}.{ext}`
- Solo el dueño puede leer/borrar sus archivos. Service role acceso total (admin).

### Base de datos
Ampliar la tabla existente `transcriptions` (hoy infrautilizada) con campos nuevos:
- `provider` (adagio / openai)
- `audio_path` (ya existe) → ruta en bucket `transcripciones`
- `audio_format`, `file_size_bytes`
- `original_text` (lo que dijo el modelo)
- `text` (ya existe) → texto final mostrado al usuario
- `corrected_text` (si el usuario corrigió)
- `is_validated` (true/false/null)
- `feedback_id` (FK a `transcription_feedback`, opcional)
- `updated_at`

RLS: cada usuario ve/edita/borra solo lo suyo. Admin (service_role) acceso total para que aparezca en el panel admin si lo deseas más adelante.

---

## Flujo nuevo en la app

```text
1. Usuario graba/sube audio
2. Pulsa "Transcribir con Adagio" (o ChatGPT en comparación)
3. Se llama al motor STT → devuelve texto
4. ➜ NUEVO: subir audio a bucket `transcripciones`
   ➜ NUEVO: insertar fila en `transcriptions` con audio_path + original_text + text
   ➜ guardar el `id` devuelto en el estado del componente
5. Se muestra el resultado + FeedbackPrompt
6. Usuario responde:
   - "Sí, correcto" → UPDATE transcriptions SET is_validated=true
   - "No" + corrección → UPDATE transcriptions SET corrected_text=..., text=corrección, is_validated=false
   - "No" sin corrección → UPDATE transcriptions SET is_validated=false
7. (El feedback sigue guardándose en `transcription_feedback` como hasta ahora, para los puntos)
```

---

## Consentimiento

- Para **guardar el audio** en el bucket: requiere `data_use_consent = true` (igual que hoy con `inferencias`). Si no lo tiene, se guarda solo el texto sin audio.
- Para **guardar el texto transcrito**: siempre se guarda si el usuario está logueado (es su propio dato, no se comparte).
- Si el usuario **no está logueado** → no se guarda nada (comportamiento actual). Se le muestra un aviso suave invitando a iniciar sesión.

---

## Dónde lo verá el usuario

Crear una nueva página **"Mis Transcripciones"** (`/mis-transcripciones`) accesible desde el menú de usuario, separada de "Mis Grabaciones" (que es de entrenamiento). Mostrará una lista con:
- Fecha
- Proveedor (Adagio / ChatGPT)
- Texto final
- Botón para reproducir el audio (si se guardó)
- Indicador visual de si fue validado/corregido
- Botón borrar

---

## Cambios técnicos

### 1. Migración SQL
- Crear bucket `transcripciones` + políticas RLS.
- Añadir columnas a `transcriptions`: `provider`, `audio_format`, `file_size_bytes`, `original_text`, `corrected_text`, `is_validated`, `feedback_id`, `updated_at`.
- Trigger `updated_at` automático.

### 2. Nuevo servicio `src/services/transcriptionStore.ts`
- `saveTranscription({ audioBlob, text, provider, durationSec })` → sube audio (si hay consent) + inserta fila → devuelve `transcriptionId`.
- `updateTranscriptionFeedback(id, { isCorrect, correctedText })` → UPDATE de la fila.
- `listMyTranscriptions()`, `deleteTranscription(id)`, `getAudioUrl(path)` (signed URL).

### 3. Modificar `TranscribeView.tsx` y `ComparisonView.tsx`
- Tras transcripción exitosa → llamar `saveTranscription` y guardar `transcriptionId` en estado.
- Pasar `transcriptionId` a `<FeedbackPrompt>` como prop nueva.

### 4. Modificar `FeedbackPrompt.tsx`
- Aceptar prop opcional `transcriptionId`.
- Después de enviar feedback → llamar `updateTranscriptionFeedback(transcriptionId, ...)`.

### 5. Nueva página `src/pages/MyTranscriptions.tsx` + ruta en `App.tsx` + entrada en `UserMenu.tsx`.

---

## Lo que NO cambia
- Apartado **Entrenar** sigue intacto (sigue usando `audio_metadata`, `audio_raw`, cifrado AES-256).
- Tabla `transcription_feedback` y sistema de puntos siguen funcionando igual.
- Bucket `inferencias` se mantiene (compatibilidad con feedback antiguo).
- Si el usuario no está logueado → todo igual que ahora (no se guarda nada).

---

## Preguntas antes de implementar

1. ¿Quieres que esto **requiera consentimiento explícito** (un check tipo "guardar mis transcripciones") o que se guarde automáticamente para cualquier usuario logueado?
2. ¿La nueva página **"Mis Transcripciones"** debe aparecer también en el panel **admin** (para que veas todas las transcripciones de todos los usuarios), o solo personal de cada usuario?
3. ¿Quieres que las transcripciones tengan un **límite de retención** automático (ej. borrar tras 30/90 días), o se guardan indefinidamente hasta que el usuario las borre?