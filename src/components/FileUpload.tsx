import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ErrorState } from '@/components/ErrorState';
import { Upload, File, X, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const ACCEPTED_AUDIO_TYPES = [
  'audio/wav',
  'audio/mp3',
  'audio/mpeg', 
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/aac'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      setUploadError('INVALID_FORMAT');
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('LARGE_FILE');
      return false;
    }

    // Check if file is empty
    if (file.size === 0) {
      setUploadError('EMPTY_FILE');
      return false;
    }

    return true;
  };

  const handleFileSelection = (file: File) => {
    setUploadError(null);
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
      toast({
        title: "Archivo seleccionado",
        description: `${file.name} listo para transcribir`,
      });
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileSelection(file);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileSelection(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getErrorDetails = (errorCode: string) => {
    switch (errorCode) {
      case 'INVALID_FORMAT':
        return {
          title: 'Formato no válido',
          description: 'El tipo de archivo seleccionado no es compatible.',
          solution: 'Usa archivos de audio en formato WAV, MP3, WEBM, OGG, M4A o AAC.'
        };
      case 'LARGE_FILE':
        return {
          title: 'Archivo muy grande',
          description: 'El archivo supera el límite de 10MB.',
          solution: 'Reduce la duración del audio, usa menor calidad de grabación, o comprime el archivo.'
        };
      case 'EMPTY_FILE':
        return {
          title: 'Archivo vacío',
          description: 'El archivo seleccionado está vacío o dañado.',
          solution: 'Verifica que el archivo contenga audio válido e inténtalo con otro archivo.'
        };
      default:
        return {
          title: 'Error desconocido',
          description: 'Ocurrió un problema al procesar el archivo.',
          solution: 'Inténtalo con otro archivo o contacta con soporte.'
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Error State */}
      {uploadError && (
        <ErrorState 
          {...getErrorDetails(uploadError)}
          onRetry={() => setUploadError(null)}
        />
      )}

      {/* Drag & Drop Area - Main and only file selection method */}
      <Card
        className={`relative border-2 border-dashed transition-colors cursor-pointer ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : selectedFile
            ? 'border-success bg-success/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={ACCEPTED_AUDIO_TYPES.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {selectedFile ? (
            <>
              <CheckCircle className="h-12 w-12 text-success mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  Archivo seleccionado
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <File className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                  <span>({formatFileSize(selectedFile.size)})</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  Arrastra tu archivo aquí
                </p>
                <p className="text-sm text-muted-foreground">
                  o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: WAV, MP3, WEBM, OGG, M4A, AAC (máx. 10MB)
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedFile.type} • {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};