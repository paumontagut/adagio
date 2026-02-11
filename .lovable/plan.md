

# Corregir modelo ChatGPT Realtime y duracion de audio

## Problema 1: Modelo Realtime no encontrado

El modelo `gpt-4o-realtime-preview-2024-12-17` ya no esta disponible. Aparece el error `model_not_found` cuando se intenta generar la respuesta.

**Solucion**: Cambiar a `gpt-4o-mini-realtime-preview` en tres lugares:

| Archivo | Cambio |
|---------|--------|
| `.env` | Cambiar `VITE_REALTIME_MODEL` a `gpt-4o-mini-realtime-preview` |
| `supabase/functions/realtime-ephemeral/index.ts` (linea 30) | Cambiar modelo en `sessionConfig` |
| `src/services/realtime.ts` (linea 147) | Cambiar modelo en la URL de conexion WebRTC |

## Problema 2: Duracion muestra 0 segundos

En `src/components/RecorderUploader.tsx`, cuando un archivo subido no necesita conversion (ya es WAV 16kHz mono), se asigna `duration: 0` sin calcularla.

**Solucion**: Decodificar siempre el audio con `AudioContext.decodeAudioData()` para obtener la duracion real, incluso cuando no se necesita conversion de formato.

### Cambio en `src/components/RecorderUploader.tsx`

En la rama `else` de `handleFileSelect` (lineas 82-96), en vez de asumir `duration: 0`, decodificar el ArrayBuffer para leer `audioBuffer.duration`.

```text
// Antes (linea 94):
duration: 0 // Will be updated by audio element

// Despues:
// Decode to get real duration
const audioCtx = new AudioContext();
const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
const realDuration = decoded.duration;
audioCtx.close();
// ... usar realDuration en metadata
```

## Resumen de archivos afectados

| Archivo | Que cambia |
|---------|-----------|
| `supabase/functions/realtime-ephemeral/index.ts` | Modelo a `gpt-4o-mini-realtime-preview` |
| `src/services/realtime.ts` | Modelo en URL WebRTC |
| `src/components/RecorderUploader.tsx` | Calcular duracion real decodificando audio |

