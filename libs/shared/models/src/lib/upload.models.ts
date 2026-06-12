export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;   // data URL — solo para imágenes
  error?: string;
}

export interface UploadError {
  file: string;
  reason: 'type' | 'size' | 'max-files';
  message: string;
}
