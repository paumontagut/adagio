## Contexto

El sync Lovable ↔ GitHub estuvo caído ~2 semanas. Aunque ahora el último commit (deploy marker en `MobileAuthCallback.tsx`) sí llegó al repo, eso solo prueba que el sync funciona **a partir de ahora** — no garantiza que los commits intermedios (sistema de puntos, ruta mobile, etc.) se hayan recuperado retroactivamente.

Hay que verificar archivo por archivo que lo crítico está en GitHub.

## Archivos clave a verificar en GitHub

Lo añadido / modificado en las últimas semanas que debería estar sí o sí:

**Sistema de puntos**
- `src/hooks/useUserPoints.ts`
- `src/pages/MyPoints.tsx`
- `src/services/feedback.ts`
- Migraciones SQL de `user_points` y `transcription_feedback` en `supabase/migrations/`

**Auth móvil**
- `src/pages/MobileAuthCallback.tsx` (con el comentario `// Deploy marker:` al inicio → es la prueba más fiable de que el sync está al día)
- Ruta `/auth/mobile-callback` registrada en `src/App.tsx`

**Menú de usuario**
- `src/components/UserMenu.tsx` (entrada a "Mis puntos")

**Edge functions recientes**
- `supabase/functions/stt-runpod/index.ts`
- `supabase/functions/stt-openai/index.ts`

## Cómo verificarlo (3 opciones, de menos a más esfuerzo)

### Opción A — Visual rápida en GitHub (1 min)

En tu repo de GitHub, ve directamente a estas URLs (sustituye `TU_USUARIO/TU_REPO`):

```
github.com/TU_USUARIO/TU_REPO/blob/main/src/pages/MyPoints.tsx
github.com/TU_USUARIO/TU_REPO/blob/main/src/pages/MobileAuthCallback.tsx
github.com/TU_USUARIO/TU_REPO/blob/main/src/hooks/useUserPoints.ts
github.com/TU_USUARIO/TU_REPO/blob/main/src/services/feedback.ts
```

Si los 4 cargan y el primero de `MobileAuthCallback.tsx` muestra `// Deploy marker: ...`, el sync recuperó todo. Si alguna da 404, hay hueco.

### Opción B — Comparar commits (2 min)

En GitHub:
```
github.com/TU_USUARIO/TU_REPO/commits/main
```
Mira si ves commits de las últimas 2 semanas con mensajes tipo "Add MyPoints page", "Add user points system", "Add mobile auth callback". Si solo ves commits muy antiguos + el de hoy (deploy marker), el sync **no** recuperó el histórico.

### Opción C — Script de diff exhaustivo (más fiable)

Generar en Lovable un fichero `sync-check.json` con un listado + hash SHA-256 de los ~20 archivos críticos. Tu compa hace `git pull` y corre un script local que recalcula los hashes y dice cuáles faltan o difieren. Cero ambigüedad, pero requiere que ejecute un comando.

## Recomendación

Empezar por **Opción A** (30 segundos). Si los 4 archivos cargan correctamente en GitHub, estás cubierto y no hace falta más. Si alguno falla, pasamos a Opción C para encontrar exactamente qué falta y restaurarlo desde Lovable forzando re-commits.

## Pregunta antes de implementar

¿Quieres que prepare ya la **Opción C** (el `sync-check.json` + script de verificación) o prefieres probar primero la Opción A tú mismo abriendo esas 4 URLs en GitHub?
