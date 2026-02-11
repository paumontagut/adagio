

# Eliminar overlay "Estamos trabajando en Adagio" de TranscribeView

## Cambio

En `src/components/TranscribeView.tsx`, eliminar:

1. El bloque del overlay (lineas ~152-181): el `div` con clase `absolute inset-0 z-50` que contiene el mensaje "Estamos trabajando en Adagio" y el boton "Ir a Entrenar Modelo".

2. Las clases que desactivan el contenido de fondo (linea ~191): quitar `pointer-events-none opacity-50 filter blur-[2px] transition-all` del wrapper inferior, dejandolo como un `div` normal.

3. Las importaciones no utilizadas: `Sparkles`, `ArrowRight` y `useSearchParams` que solo se usaban para el overlay.

## Resultado

La seccion de transcripcion volvera a ser funcional e interactiva, mostrando el grabador/uploader, el boton "Transcribir con Adagio" y los resultados sin ningun bloqueo visual.

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/components/TranscribeView.tsx` | Eliminar overlay y restaurar interactividad |

