
# Plan: Permitir Espacios en el Campo de Nombre Completo

## Problema Identificado

El campo "Nombre completo" en el modal de consentimiento no permite escribir espacios porque hay un **manejador de teclado global** en `TrainView.tsx` que intercepta la tecla espacio para usarla como atajo de grabación.

### Código Problemático (TrainView.tsx, líneas 518-525)

```javascript
if (e.key === ' ' && !e.repeat) {
  e.preventDefault();  // Bloquea TODOS los espacios
  if (audioBlob) {
    handleSubmit();
  } else {
    handleRecordToggle();
  }
}
```

El `e.preventDefault()` se ejecuta **siempre** que se presiona espacio, sin verificar si el foco está en un campo de texto.

---

## Solución

Modificar el manejador de teclado para que **ignore la tecla espacio cuando el usuario está escribiendo** en un input o textarea.

### Cambio Requerido

**Archivo:** `src/components/TrainView.tsx`  
**Líneas:** 512-536

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (!e.key) return;
    
    // Ignorar atajos si el foco está en un campo de texto
    const activeElement = document.activeElement;
    const isTyping = activeElement instanceof HTMLInputElement || 
                     activeElement instanceof HTMLTextAreaElement ||
                     activeElement?.getAttribute('contenteditable') === 'true';
    
    if (isTyping) {
      return; // No interceptar teclas mientras se escribe
    }
    
    if (e.ctrlKey && !e.repeat) {
      handlePlayPhrase();
    }
    if (e.key === ' ' && !e.repeat) {
      e.preventDefault();
      if (audioBlob) {
        handleSubmit();
      } else {
        handleRecordToggle();
      }
    }
    if (e.altKey && !e.repeat) {
      if (audioBlob) {
        handleReRecord();
      }
    }
    if (e.key.toLowerCase() === 'p' && !e.repeat) {
      if (audioBlob) {
        handlePlayRecording();
      }
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [audioBlob, isRecording, isPlaying]);
```

---

## Lógica de la Solución

| Situación | Comportamiento Actual | Comportamiento Nuevo |
|-----------|----------------------|---------------------|
| Espacio en input | Bloqueado, inicia grabación | Permite escribir espacio |
| Espacio fuera de input | Inicia grabación | Sin cambios |
| Otras teclas en input | Funcionan | Sin cambios |

---

## Beneficios

1. Los usuarios podrán escribir nombres completos con espacios (ej: "Juan García López")
2. Los atajos de teclado seguirán funcionando cuando no se está escribiendo
3. Mejora la accesibilidad del formulario de consentimiento

---

## Verificación

Después de implementar:
1. Abrir la sección "Entrenar"
2. En el modal de consentimiento, escribir un nombre con espacios
3. Verificar que los espacios aparecen correctamente
4. Cerrar el modal y verificar que la barra espaciadora sigue funcionando para grabar
