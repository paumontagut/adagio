

## Estado actual

- **Al grabar**: ✅ Se guarda el progreso correctamente (después de avanzar la frase)
- **Al pulsar "Siguiente"**: ❌ No se guarda — el botón avanza la frase (`getNewPhrase()`) pero no llama a `saveProgress()`

## Plan

### Archivo: `src/components/TrainView.tsx`

Añadir `saveProgress()` en el handler del botón "Siguiente", después de `getNewPhrase()`:

```typescript
onClick={() => {
  console.log('[TrainView] Next button clicked');
  getNewPhrase();
  setPhraseCount(prev => prev + 1);
  if (isAuthenticated) {
    saveProgress();
  }
}}
```

Un cambio de 2 líneas. No se necesitan migraciones ni otros archivos.

