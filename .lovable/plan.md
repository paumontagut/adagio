

## Problema
La palabra "DESARZOBISPOCONSTANTINOPOLIZAREIS" es demasiado larga y se corta horizontalmente. Las clases `break-words` y `hyphens-auto` no son suficientes porque `hyphens-auto` depende del diccionario del navegador y no funciona bien con palabras inventadas/compuestas en español.

## Solución

### Archivo: `src/components/TrainView.tsx`

**1. Quitar `max-w-3xl` del contenedor** para permitir que el widget use más ancho disponible, y usar `max-w-4xl` en su lugar:

```typescript
// Línea 654: max-w-3xl → max-w-4xl
<div className="max-w-4xl mx-auto space-y-6 md:space-y-12">
```

**2. Añadir `overflow-hidden` al Card y `overflow-wrap: anywhere`** al h1 para forzar el salto de línea en cualquier punto de palabras ultra-largas:

```typescript
// Línea 657-659
<Card className="p-6 md:p-12 text-center shadow-lg border-2 overflow-hidden">
  <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4 md:mb-8 leading-relaxed uppercase break-all hyphens-auto text-wrap-balance"
      style={{ overflowWrap: 'anywhere' }}>
    {currentPhrase}
  </h1>
```

Cambios clave:
- `max-w-3xl` → `max-w-4xl`: más espacio horizontal
- `break-words` → `break-all`: fuerza el corte en cualquier carácter, no solo entre palabras
- `overflowWrap: 'anywhere'`: fallback que garantiza que el texto nunca desborde
- `overflow-hidden` en el Card: protección extra contra desbordamiento

