
# Mejoras de Accesibilidad para Adagio

## Contexto
Adagio es una herramienta para personas con habla atipica, y los voluntarios que la usan pueden tener trastornos fisicos diversos. Es fundamental que toda la web sea navegable con teclado y que el texto sea legible con tamanos grandes.

## Cambios propuestos

### 1. Aumentar el tamano base de fuente (index.css + tailwind.config.ts)
- Aumentar el `font-size` base del `body` de 16px a 18px
- Definir una clase CSS de escalado global para que todos los `text-sm`, `text-xs` etc. sean proporcionalmente mas grandes
- Configurar `min-font-size` para que ningun texto sea menor de 14px

### 2. Indicadores de foco visibles globalmente (index.css)
- Anadir estilos globales de `focus-visible` con un anillo grueso y de alto contraste (borde teal de 3px) para TODOS los elementos interactivos
- Asegurar que el outline nunca se oculte excepto en elementos decorativos

### 3. Navegacion principal accesible (Index.tsx + Colabora.tsx)
- Cambiar los `<button>` de navegacion a un patron con `role="tablist"` / `role="tab"` o anadir `aria-current` al boton activo
- Anadir `aria-label` a la barra de navegacion flotante
- Aumentar el tamano de los botones de la barra (`py-3` en vez de `py-2`, `text-sm` en vez de `text-xs` en movil)
- Asegurar que todos los botones tienen focus ring visible

### 4. TrainView - boton principal accesible (TrainView.tsx)
- El boton grande de grabar/enviar es un `<button>` nativo pero le faltan `aria-label` y `role` descriptivos
- Anadir `aria-label` dinamico segun estado (grabar / parar / enviar)
- Anadir `aria-live="assertive"` al indicador de estado de grabacion
- Aumentar tamanos de texto en las etiquetas de los controles

### 5. RecorderUploader - tamanos y foco (RecorderUploader.tsx)
- Aumentar tamanos de texto en las etiquetas y metadatos del audio
- Asegurar que Play/Pause/Reset tienen `aria-label`

### 6. ComparisonView - accesibilidad (ComparisonView.tsx)
- Anadir `aria-label` a los botones de accion (Copiar, Descargar, TTS)
- Aumentar tamano de texto en resultados

### 7. Footer accesible (Footer.tsx)
- Anadir `aria-label="Pie de pagina"` al `<footer>`
- Asegurar que los enlaces externos tienen `aria-label` descriptivo

### 8. TranscribeView - tamanos (TranscribeView.tsx)
- Aumentar tamano de texto de las pestanas
- Aumentar tamano del boton "Transcribir con Adagio"

---

## Detalle tecnico

### index.css
```css
/* Tamano base mayor */
html {
  font-size: 18px;
}

/* Tamano minimo para texto pequeno */
.text-xs { font-size: max(0.8rem, 14px); }
.text-sm { font-size: max(0.9rem, 15px); }

/* Focus visible global */
*:focus-visible {
  outline: 3px solid hsl(185 100% 20%);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Componentes principales
- Index.tsx, Colabora.tsx: aumentar `text-xs md:text-sm` a `text-sm md:text-base` en botones de nav; anadir `aria-current="page"` al tab activo
- TrainView.tsx: anadir `aria-label` al boton grande; `aria-live="assertive"` al estado de grabacion
- TranscribeView.tsx: aumentar texto de tabs y botones
- ComparisonView.tsx: anadir `aria-label` a botones icon-only
- Footer.tsx: `aria-label` en el footer y enlaces externos

### Archivos afectados
| Archivo | Tipo de cambio |
|---------|---------------|
| `src/index.css` | Tamano base, focus global, min font sizes |
| `src/pages/Index.tsx` | Nav accesible, tamanos de texto |
| `src/pages/Colabora.tsx` | Nav accesible, tamanos de texto |
| `src/components/TrainView.tsx` | ARIA labels, tamanos |
| `src/components/TranscribeView.tsx` | Tamanos de pestanas y botones |
| `src/components/ComparisonView.tsx` | ARIA labels en botones |
| `src/components/RecorderUploader.tsx` | ARIA labels, tamanos |
| `src/components/Footer.tsx` | ARIA labels |
