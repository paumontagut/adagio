# Sistema de Transcripción - Adagio

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las URLs de tu servidor FastAPI:

```env
# URLs del servidor de transcripción (reemplaza con tu Cloudflare Tunnel)
VITE_TRANSCRIBE_URL=https://tu-tunnel.trycloudflare.com/transcribe
VITE_HEALTH_URL=https://tu-tunnel.trycloudflare.com/healthz

# Opcional: Timeout de transcripción en segundos (default: 90)
VITE_TRANSCRIBE_TIMEOUT=90
```

### Servidor Backend Requerido

Tu servidor FastAPI debe exponer:

1. **POST /transcribe**
   - Acepta: `multipart/form-data` con campo `file`
   - Formatos soportados: WAV, MP3, WebM
   - Tamaño máximo: 20MB
   - Respuesta: `{ "text": "transcripción..." }`

2. **GET /healthz** (o /health)
   - Respuesta: Cualquier respuesta 200 OK indica que está online

## Funcionalidades

### ✅ Completadas

- **Configuración por variables de entorno**
  - URLs configurables sin hardcodear
  - Timeout ajustable

- **Servicio de Transcripción** (`services/transcribe.ts`)
  - `ping()`: Verificación de estado del backend
  - `transcribeFile()`: Envío y procesamiento de archivos
  - Manejo completo de errores con códigos específicos
  - Timeout de 90s configurable

- **Conversión de Audio** (`lib/audioConverter.ts`)
  - Conversión automática a WAV 16kHz mono
  - Soporte para resampling y conversión de canales
  - Web Audio API para compatibilidad del navegador

- **Componente RecorderUploader**
  - Grabación desde micrófono
  - Subida de archivos (drag & drop)
  - Conversión automática cuando es necesaria
  - Previsualización con play/pause

- **Estado del Backend** (`BackendStatus`)
  - Badge online/offline en tiempo real
  - Auto-refresh cada 30 segundos
  - Indicación de último check y errores

- **UX Completa**
  - Estados: idle → uploading → transcribing → completed
  - Barra de progreso para subida
  - Spinner durante transcripción
  - Mensajes de error detallados y amigables

- **Resultados**
  - Textarea de solo lectura con transcripción
  - Botones copiar y descargar .txt
  - Metadatos del audio procesado
  - Opción "Transcribir otro audio"

### Estados y Errores Manejados

- ❌ `CONFIG_ERROR`: URLs no configuradas
- ❌ `NO_FILE`: Archivo no proporcionado
- ❌ `INVALID_FORMAT`: Formato no soportado
- ❌ `FILE_TOO_LARGE`: Archivo > 20MB
- ❌ `NETWORK_ERROR`: Error de conexión
- ❌ `TIMEOUT`: Tiempo de espera agotado
- ❌ `SERVER_ERROR`: Error 500+ del servidor
- ❌ `HTTP_ERROR`: Otros errores HTTP

## Uso

1. **Configurar variables de entorno** con las URLs de tu backend
2. **Grabar audio** o **subir archivo** (WAV/MP3 hasta 20MB)
3. El sistema **convierte automáticamente** a WAV 16kHz mono si es necesario
4. **Verificar** que el backend esté online (badge verde)
5. **Transcribir** - el proceso muestra progreso en tiempo real
6. **Copiar o descargar** el resultado

## Criterios de Aceptación Cumplidos

✅ Grabación de 5-20s transcribe con un clic  
✅ Subida de WAV/MP3 y transcripción  
✅ Conversión automática a WAV 16kHz mono  
✅ URL configurable via `VITE_TRANSCRIBE_URL`  
✅ Estados y errores mostrados claramente  
✅ Sin warnings en consola  
✅ UI responsive y accesible (WCAG AA)  

## Arquitectura

```
TranscribeView
├── BackendStatus (online/offline)
├── RecorderUploader
│   ├── AudioRecorder (micrófono)
│   ├── FileUpload (archivos)
│   └── audioConverter (WAV 16kHz mono)
├── Processing States (uploading/transcribing)
├── Error Handling (códigos específicos)
└── Results (textarea + acciones)
```

## Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Audio**: Web Audio API para conversión
- **HTTP**: Fetch API con FormData
- **Estado**: React hooks + toast notifications
- **Estilos**: Tailwind CSS + shadcn/ui components