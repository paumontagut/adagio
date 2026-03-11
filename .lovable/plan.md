

## Resumen

Hay 3 problemas a resolver:

1. **Persistencia del progreso de entrenamiento** — El hook `useTrainingProgress` ya existe pero **nunca se usa** en `TrainView.tsx`. Cada vez que se abre la página, se empieza desde cero. Hay ~61 frases en el golden set y ~1078 en training-phrases.json (**~1139 frases en total**, aunque tras filtrar duplicados serán unas ~1078 en la fase extendida).

2. **Tipografía de las frases** — Actualmente la frase se muestra en línea 654 con clases `text-xl sm:text-2xl md:text-4xl`. Hay que hacerla más grande y en mayúsculas.

3. **Redirección tras login con Google** — Tras autenticarse, el usuario acaba en `https://adagiotest.lovable.app/#` en vez de `https://adagiotest.lovable.app/`. Esto pasa porque `AuthCallback` redirige a `/` con `navigate('/')`, pero el hash fragment (`#access_token=...`) que Supabase añade no se limpia correctamente.

---

## Plan de implementación

### 1. Integrar `useTrainingProgress` en TrainView

- Importar y llamar `useTrainingProgress()` en `TrainView.tsx`
- Tras inicializar `phraseService`, llamar `loadProgress()` para restaurar la fase y el índice del golden set
- Después de cada grabación exitosa (cuando se avanza de frase), llamar `saveProgress()` para persistir en la base de datos
- Mostrar un spinner mientras `isLoading` del hook esté activo

### 2. Tipografía de frases más grande y en mayúsculas

- En la línea 654 de `TrainView.tsx`, cambiar las clases CSS del `<h1>` que muestra `currentPhrase`:
  - Añadir `uppercase` para mayúsculas
  - Aumentar tamaños: `text-2xl sm:text-3xl md:text-5xl`

### 3. Limpiar hash fragment tras login de Google

- En `AuthCallback.tsx`, antes de llamar a `navigate('/')`, limpiar el hash fragment con `window.location.hash = ''` o usar `navigate('/', { replace: true })` junto con `window.history.replaceState(null, '', '/')` para eliminar el `#` residual

---

## Detalle técnico

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/TrainView.tsx` | Importar y usar `useTrainingProgress`, guardar progreso tras cada frase, aplicar uppercase y tamaño mayor a la frase |
| `src/pages/AuthCallback.tsx` | Limpiar hash fragment antes de navegar |

No se requieren migraciones de base de datos — la tabla `training_progress` ya existe según el hook.

