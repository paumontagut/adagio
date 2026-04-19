

El usuario refina el plan: las estadísticas de acierto/fallo de Adagio se guardan **en privado** (no se muestran al usuario). En su lugar, gamificamos con un **sistema de puntos** que premia el feedback (validar Sí/No) y la corrección manual.

## Plan revisado: validación gamificada con puntos

### 1. Recolección de feedback (sin cambios respecto al plan anterior)

Después de cada transcripción, mostramos:
> "¿Has querido decir: 'X'? ✅ Sí / ❌ No"

Si "No" → textarea para corrección → guardar.

### 2. Datos en Supabase

**Tabla `transcription_feedback`** (privada, sin exponer estadísticas al usuario):

| Campo | Tipo |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid (RLS por `auth.uid()`) |
| `provider` | text (`adagio` / `openai`) |
| `predicted_text` | text |
| `is_correct` | boolean |
| `corrected_text` | text nullable |
| `audio_path` | text nullable (bucket `inferencias` si hay `data_use_consent`) |
| `duration_seconds` | int nullable |
| `points_awarded` | int |
| `created_at` | timestamptz |

**Tabla `user_points`** (gamificación visible):

| Campo | Tipo |
|---|---|
| `user_id` | uuid PK (RLS) |
| `total_points` | int default 0 |
| `feedback_count` | int default 0 |
| `corrections_count` | int default 0 |
| `updated_at` | timestamptz |

RLS: usuario solo ve/actualiza su fila. Service role full access.

### 3. Sistema de puntos

| Acción | Puntos |
|---|---|
| Validar "Sí, es correcto" | **+5** |
| Validar "No" sin corregir | **+5** |
| Validar "No" + escribir corrección | **+15** (más valioso para el dataset) |

Los puntos se otorgan al guardar el feedback (lógica en cliente con upsert atómico, o mejor: trigger en BD que incrementa `user_points` al insertar en `transcription_feedback`).

### 4. UI de gamificación (lo que SÍ ve el usuario)

- **Badge de puntos** en `UserMenu` (esquina superior): `⭐ 245 pts`.
- **Toast tras feedback**: "+15 puntos por tu corrección 🎉"
- **Mini panel opcional** en `MyData` o nueva pestaña: total de puntos, nº de feedbacks, nº de correcciones aportadas.
- **NO mostramos**: tasa de acierto de Adagio, comparativa de modelos, ni nada que revele rendimiento del modelo.

### 5. Cambios técnicos

1. **Migración SQL**:
   - Crear `transcription_feedback` + RLS + índice por `user_id, provider`.
   - Crear `user_points` + RLS.
   - Trigger `award_points_on_feedback`: al insertar en `transcription_feedback`, hace `UPSERT` en `user_points` sumando los puntos correspondientes (5 / 15 según `corrected_text IS NULL`).

2. **`src/services/feedback.ts`** (nuevo): `saveFeedback({ provider, predictedText, isCorrect, correctedText, audioBlob, durationSec })` que:
   - Sube audio al bucket `inferencias` si `data_use_consent = true`.
   - Inserta en `transcription_feedback` (los puntos los calcula el trigger).
   - Devuelve los puntos otorgados para mostrarlos en el toast.

3. **`src/hooks/useUserPoints.ts`** (nuevo): lee `user_points` del usuario actual, expone `totalPoints` y un método `refresh()`. Suscripción realtime opcional para actualizar el badge en vivo.

4. **`src/components/FeedbackPrompt.tsx`** (nuevo): componente reutilizable con los botones Sí/No + textarea condicional + botón guardar.

5. **`TranscribeView.tsx`**: nuevo estado `awaiting_validation` entre `completed` y reset. Renderiza `<FeedbackPrompt />` antes de los botones de copiar/descargar.

6. **`ComparisonView.tsx`**: un `<FeedbackPrompt />` por cada proveedor (datos comparativos directos, también privados).

7. **`UserMenu.tsx`**: añadir badge de puntos junto al avatar.

### 6. Privacidad

- `transcription_feedback` solo accesible por el usuario (sus filas) y service role (analítica admin).
- Audio etiquetado solo se sube si existe `data_use_consent = true` en `user_consents`.
- Al ejecutar borrado total de datos del usuario: limpiar también `transcription_feedback`, `user_points` y archivos del bucket.

### Fuera de alcance (futuro)

- Niveles, badges visuales, leaderboards.
- Vista admin de WER / precisión por modelo (los datos ya estarán en `transcription_feedback`).
- Reentrenamiento automático.

