

# Corregir Transcripcion Adagio y pestana ChatGPT vs Adagio

## Problema 1: El boton "Transcribir con Adagio" esta desactivado

El boton requiere que `backendOnline` sea `true`, pero el componente `BackendStatus` no esta renderizado en la vista actual, asi que `backendOnline` nunca cambia de `false`. Ademas, falta mostrar el estado del backend al usuario.

**Solucion**: Anadir el componente `BackendStatus` con su callback `onStatusChange` para actualizar el estado `backendOnline`.

## Problema 2: La pestana "ChatGPT vs Adagio" esta vacia

La pestana existe en la barra de tabs, pero no tiene contenido: falta el bloque `<TabsContent value="comparison">` con el componente `ComparisonView`.

**Solucion**: Anadir el `TabsContent` con el `ComparisonView` que ya esta importado.

## Problema 3: Faltan los estados de progreso, error y resultados en la pestana Adagio

Cuando se quito el overlay se perdieron tambien los bloques de UI para mostrar progreso durante la transcripcion, errores, y los resultados finales (textarea con botones de copiar/descargar).

**Solucion**: Restaurar los bloques de UI para:
- Barra de progreso durante procesamiento
- Estado de error con boton de reintentar
- Resultado de transcripcion con acciones (copiar, descargar, escuchar, nueva transcripcion)

---

## Cambios en un solo archivo

### `src/components/TranscribeView.tsx`

1. **Anadir `BackendStatus`** debajo del `RecorderUploader`, conectado a `setBackendOnline`.

2. **Anadir bloque de progreso**: Mostrar `Progress` y texto de estado cuando `isProcessing` es `true`.

3. **Anadir bloque de error**: Mostrar `ErrorState` cuando `state === "error"`, con boton de reintentar.

4. **Anadir bloque de resultados**: Cuando `hasResults`, mostrar el texto transcrito en un `Textarea` de solo lectura, con botones de copiar, descargar, escuchar (TTS) y "Transcribir otro audio".

5. **Anadir `TabsContent value="comparison"`** con el componente `ComparisonView` que ya esta importado.

| Seccion | Que se anade |
|---------|-------------|
| Despues de RecorderUploader | `BackendStatus` con `onStatusChange` |
| Despues del boton Transcribir | Barra de progreso (cuando `isProcessing`) |
| Despues del progreso | `ErrorState` (cuando `state === "error"`) |
| Despues del error | Resultados: textarea + copiar/descargar/TTS/reset |
| Despues del `TabsContent adagio` | `TabsContent comparison` con `ComparisonView` |

