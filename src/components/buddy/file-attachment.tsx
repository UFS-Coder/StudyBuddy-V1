import React, { useRef, useState } from 'react';
import { Camera, Paperclip, X, Image, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FileAttachment {
  id: string;
  file: File;
  type: 'image' | 'document' | 'other';
  preview?: string;
  name: string;
  size: number;
}

interface FileAttachmentProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILES = 5;

export const FileAttachmentComponent: React.FC<FileAttachmentProps> = ({
  attachments,
  onAttachmentsChange,
  maxFiles = MAX_FILES,
  maxFileSize = MAX_FILE_SIZE_MB,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const getFileType = (file: File): 'image' | 'document' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf' || 
        file.type.includes('document') || 
        file.type === 'text/plain') return 'document';
    return 'other';
  };

  const createFileAttachment = async (file: File): Promise<FileAttachment> => {
    const id = Math.random().toString(36).substr(2, 9);
    const type = getFileType(file);
    let preview: string | undefined;

    if (type === 'image') {
      preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    return {
      id,
      file,
      type,
      preview,
      name: file.name,
      size: file.size
    };
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name} ist zu groß (max. ${maxFileSize}MB)`);
        continue;
      }

      // Check file type
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isAccepted) {
        errors.push(`${file.name} ist kein unterstützter Dateityp`);
        continue;
      }

      validFiles.push(file);
    }

    // Check total file count
    if (attachments.length + validFiles.length > maxFiles) {
      errors.push(`Maximal ${maxFiles} Dateien erlaubt`);
      return;
    }

    if (errors.length > 0) {
      // In a real app, you'd show these errors to the user
      console.warn('File upload errors:', errors);
    }

    // Create attachments for valid files
    const newAttachments = await Promise.all(
      validFiles.map(file => createFileAttachment(file))
    );

    onAttachmentsChange([...attachments, ...newAttachments]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleCameraCapture = async () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: FileAttachment['type']) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* File Upload Controls */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 px-2"
          disabled={attachments.length >= maxFiles}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCameraCapture}
          className="h-8 px-2"
          disabled={attachments.length >= maxFiles}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 bg-muted rounded-md"
            >
              {attachment.type === 'image' && attachment.preview ? (
                <img
                  src={attachment.preview}
                  alt={attachment.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-background rounded flex items-center justify-center">
                  {getFileIcon(attachment.type)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(attachment.id)}
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileAttachmentComponent;