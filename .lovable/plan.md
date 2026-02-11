

# Simplificar transcripcion ChatGPT: usar stt-openai en vez de Realtime API

## Problema actual
La comparacion "ChatGPT vs Adagio" usa la API Realtime de OpenAI (WebRTC, tokens efimeros, data channels), que es compleja y falla con errores de `model_not_found` y `rate_limit_error`. El usuario solo necesita: recibir un audio y transcribirlo con el modelo `gpt-4o-mini-transcribe-2025-12-15`.

## Solucion
Eliminar la dependencia de la API Realtime para la comparacion y usar directamente la funcion backend `stt-openai`, que llama a `/v1/audio/transcriptions` de OpenAI. Es mucho mas simple y fiable.

## Cambios

### 1. `supabase/functions/stt-openai/index.ts`
- Cambiar el modelo de `gpt-4o-mini-transcribe` a `gpt-4o-mini-transcribe-2025-12-15` (linea 56).

### 2. `src/components/ComparisonView.tsx`
- Eliminar la importacion de `startRealtimeTranscription` y tipos de `realtime.ts`.
- Crear una funcion `transcribeChatGPT(file)` que llame a la funcion backend `stt-openai` via `supabase.functions.invoke()` (multipart/form-data), mida el tiempo, y devuelva `{ text, totalMs }`.
- Reemplazar toda la logica de Realtime (callbacks, partial text, WebRTC) por una simple llamada async a `transcribeChatGPT`.
- Simplificar el estado `realtime` (ya no necesita `partialText` ni `ttfb`).
- Actualizar la UI para quitar la etiqueta "Realtime" y el texto parcial; mostrar solo el resultado final como hace Adagio.

### 3. Sin cambios necesarios en otros archivos
- `realtime.ts` y `realtime-ephemeral` quedan sin usar por la comparacion pero no se eliminan por si se usan en otro lugar.

## Resultado esperado
- La comparacion envia el audio al backend `stt-openai`.
- El backend lo transcribe con `gpt-4o-mini-transcribe-2025-12-15`.
- Se muestra el texto y el tiempo total, igual que Adagio.
- Sin WebRTC, sin tokens efimeros, sin errores de modelo Realtime.

