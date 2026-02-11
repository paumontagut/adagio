
# Corregir ComparisonView.tsx - Contenido perdido

El archivo tiene 3 secciones rotas donde aparece literalmente `// ... keep existing code` en vez del codigo real. Esto hace que se vea texto crudo en pantalla y falten componentes enteros.

## Secciones a reconstruir

### 1. Funciones `handleSpeakAdagio` y `handleStopAdagio` (linea 179)
Se reconstruyen siguiendo el mismo patron que `handleSpeakChatGPT` / `handleStopChatGPT` que si existen en el archivo, pero usando los estados `audioPlayerAdagio` e `isLoadingTTSAdagio`.

### 2. Audio Input card (linea 255)
Se reconstruye el bloque JSX que contiene:
- El componente `RecorderUploader` con `onAudioReady={handleAudioReady}`
- Metadatos del audio (duracion, tamano, formato) cuando hay audio cargado
- Boton "Comparar" que llama a `startComparison`
- Boton "Nueva comparacion" que llama a `resetComparison`

### 3. Adagio Results card (linea 259)
Se reconstruye la tarjeta de resultados de Adagio, siguiendo el mismo patron que la tarjeta ChatGPT (lineas 262-361), pero:
- Titulo: "Adagio"
- Badge: "Local"
- Descripcion: referencia al servidor Adagio
- Metricas: usa `result.ms` en vez de `result.totalMs`
- Botones TTS: usan `handleSpeakAdagio` / `handleStopAdagio`

## Archivos afectados
| Archivo | Cambio |
|---------|--------|
| `src/components/ComparisonView.tsx` | Reescribir el archivo completo restaurando las 3 secciones perdidas |
