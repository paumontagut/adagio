

## Problema
El texto de las frases en el componente TrainView no se ajusta al contenedor cuando son muy largas. Se usa `uppercase` que hace que las palabras sean más anchas, y sin control de overflow, el texto se corta visualmente.

## Solución
Agregar clases CSS para controlar el wrap del texto:

### Archivo: `src/components/TrainView.tsx`

Cambiar la línea 658:

```typescript
// ANTES:
<h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4 md:mb-8 leading-relaxed uppercase">

// DESPUÉS:
<h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4 md:mb-8 leading-relaxed uppercase break-words hyphens-auto text-wrap-balance">
```

## Cambios detallados

| Clase | Función |
|-------|---------|
| `break-words` | Fuerza saltos de línea en palabras largas si no caben |
| `hyphens-auto` | Permite guiones automáticos para división de palabras |
| `text-wrap-balance` | Distribuye el texto más equilibradamente entre líneas |

Estas clases aseguran que el texto se ajuste al ancho disponible sin desbordarse, manteniendo la legibilidad incluso con frases largas como trabajenguas.

