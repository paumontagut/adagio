-- Añadir columna full_name a recordings si no existe
alter table public.recordings add column if not exists full_name text;

-- Crear índice para mejorar performance en búsquedas
create index if not exists idx_recordings_full_name on public.recordings (full_name);