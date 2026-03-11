

## Problemas encontrados

### 1. Orden incorrecto de guardado (BUG PRINCIPAL)
`saveProgress()` se llama en la línea 361 **ANTES** de `getNewPhrase()` en la línea 369. Pero `getNewPhrase()` es quien llama a `phraseService.nextPhrase()` que avanza el índice. Resultado: se guarda el estado **anterior** al avance, así que al volver siempre se ve la frase que ya se grabó.

**Solución:** Mover `saveProgress()` para que se ejecute **después** de `getNewPhrase()`, dentro del `setTimeout`, justo después de avanzar la frase.

### 2. Política UPDATE incompleta
La política UPDATE de `training_progress` no tiene `WITH CHECK`, lo cual puede causar que el `upsert` falle silenciosamente.

**Solución:** Migración SQL para añadir `WITH CHECK (auth.uid() = user_id)` a la política UPDATE.

### 3. La tabla está vacía
Confirma que nunca se ha guardado progreso — consistente con los bugs anteriores.

---

## Cambios

### Archivo: `src/components/TrainView.tsx`
- Mover `saveProgress()` dentro del `setTimeout`, **después** de `getNewPhrase()`, para que guarde el estado ya avanzado.

### Migración SQL
```sql
DROP POLICY IF EXISTS "Users can update their own training progress" ON public.training_progress;
CREATE POLICY "Users can update their own training progress"
  ON public.training_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

