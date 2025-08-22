# Adagio - Desarrollo con Docker

Esta guía te ayudará a ejecutar Adagio usando Docker para desarrollo y producción.

## Prerrequisitos

- Docker y Docker Compose instalados
- Variables de entorno configuradas

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Puerto de la aplicación
PORT=8080

# Entorno
NODE_ENV=production

# Supabase (obligatorio para funcionalidad completa)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Base de datos local (opcional, para desarrollo)
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
POSTGRES_DB=postgres
POSTGRES_PORT=54322
```

## Desarrollo Local

### 1. Solo la aplicación web

```bash
# Construir y ejecutar
docker-compose up web

# En modo desarrollo (con hot reload)
npm install
npm run dev
```

### 2. Con Supabase local (opcional)

```bash
# Ejecutar todos los servicios
docker-compose up

# Solo la base de datos
docker-compose up supabase
```

## Producción

### 1. Conectar a Supabase

Para funcionalidad completa (base de datos, storage, analytics), conecta tu proyecto a Supabase:

1. Ve a [Supabase](https://supabase.com) y crea un proyecto
2. Obtén la URL del proyecto y la clave anónima
3. Configúrelas en las variables de entorno
4. En Lovable, haz clic en el botón verde "Supabase" para conectar

### 2. Construcción y despliegue

```bash
# Construir imagen de producción
docker build -t adagio-app .

# Ejecutar en producción
docker run -p 8080:8080 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  adagio-app

# O usando docker-compose
docker-compose -f docker-compose.yml up --build
```

## Estructura de la Base de Datos (Supabase)

Una vez conectado a Supabase, necesitarás crear estas tablas:

### Tabla recordings

```sql
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  phrase_text TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  sample_rate INTEGER NOT NULL DEFAULT 16000,
  format TEXT NOT NULL DEFAULT 'wav',
  device_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para privacidad
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read their own recordings" 
ON recordings FOR SELECT 
USING (session_id = current_setting('request.session_id', true));

CREATE POLICY "Users can insert their own recordings" 
ON recordings FOR INSERT 
WITH CHECK (session_id = current_setting('request.session_id', true));
```

### Storage bucket

```sql
-- Crear bucket para grabaciones
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recordings', 'recordings', false);

-- Política de storage
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recordings' AND auth.role() = 'authenticated');

CREATE POLICY "Users can access their own recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'recordings');
```

## Funcionalidades Implementadas

### Frontend ✅
- **Procesamiento de audio**: Conversión a 16 kHz mono PCM WAV
- **Normalización**: Peak a -1 dB automático
- **Validación**: Duración (1-30s) y nivel RMS
- **Modal de consentimiento**: Primera vez con términos
- **Analytics**: Eventos anónimos con toggle
- **Restricciones**: Solo WAV, MP3, WEBM (máx. 20MB)

### Backend (Requiere Supabase) 🔄
- **Tabla recordings**: Estructura completa definida
- **Storage**: Bucket para grabaciones con RLS
- **Analytics**: Sistema de eventos minimalista
- **API endpoints**: `/api/recordings` para subida

## Comandos Útiles

```bash
# Ver logs
docker-compose logs -f web

# Reconstruir sin cache
docker-compose build --no-cache

# Limpiar volúmenes
docker-compose down -v

# Ejecutar comandos dentro del contenedor
docker-compose exec web sh
```

## Solución de Problemas

### Error de permisos de micrófono
- Asegúrate de servir sobre HTTPS en producción
- Chrome requiere HTTPS para acceso a micrófono

### Error de conexión a Supabase
- Verifica las variables de entorno
- Confirma que el proyecto Supabase esté activo
- Revisa las políticas RLS

### Problemas de audio
- Verifica que el navegador soporte MediaRecorder
- Los formatos soportados varían por navegador
- WebM funciona mejor en Chrome, WAV es más universal

## Próximos Pasos

1. Conectar a Supabase para funcionalidad completa
2. Implementar endpoints de API en Edge Functions
3. Configurar analytics con Supabase
4. Optimizar procesamiento de audio
5. Añadir tests automatizados