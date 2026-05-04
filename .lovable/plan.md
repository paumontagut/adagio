## Objetivo

Forzar un commit nuevo en el repositorio de GitHub para que tu compa pueda verificar que el sync Lovable ↔ GitHub funciona y bajarse el código actualizado al servidor.

## Cambio propuesto

Añadir un comentario inocuo en `src/pages/MobileAuthCallback.tsx` (justo el archivo de la ruta que estamos intentando desplegar). Así además sirve de marcador claro: si tu compa ve el comentario en su servidor tras `git pull` + rebuild, sabe que tiene la versión correcta.

Concretamente, añadir al inicio del archivo:

```ts
// Deploy marker: mobile auth callback route — ensure server bundle includes /auth/mobile-callback
```

## Resultado

- Nuevo commit automático en GitHub con ese cambio.
- Tu compa hace `git pull`, ve el commit nuevo, rebuildar contenedor y la ruta `/auth/mobile-callback` quedará servida por el bundle nuevo.
- Sin impacto funcional: solo es un comentario.
