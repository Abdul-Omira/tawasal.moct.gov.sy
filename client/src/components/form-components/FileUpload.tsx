/**
 * Form Builder Platform - File Upload Component
 * Reusable file upload component for forms
 */

import React, { useState, useRef, useCallback } from 'react';
import { FileUploadConfig } from '../../types/form';
import { ComponentRenderProps } from '../../types/component';
import { cn, formatFileSize, isImageFile, isPdfFile } from '../../lib/utils';
import { CloudArrowUpIcon, XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface FileUploadProps extends ComponentRenderProps {
  config: FileUploadConfig;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  config,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  disabled,
  readOnly,
  className,
  style,
}) => {
  const {
    label,
    required,
    helpText,
    allowedTypes,
    maxFileSize,
    maxFiles,
    styling,
  } = config;

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    const currentCount = uploadedFiles.length;

    Array.from(files).forEach((file) => {
      // Check file count limit
      if (currentCount + newFiles.length >= maxFiles) {
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          error: `الملف كبير جداً. الحد الأقصى ${formatFileSize(maxFileSize)}`,
        });
        return;
      }

      // Check file type
      const fileType = file.type;
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.slice(0, -1));
        }
        return fileType === type;
      });

      if (!isAllowed) {
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          error: `نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(', ')}`,
        });
        return;
      }

      // Create preview for images
      let preview: string | undefined;
      if (isImageFile(file.name)) {
        preview = URL.createObjectURL(file);
      }

      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
      });
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
    onChange([...uploadedFiles, ...newFiles].map(f => f.file));
  }, [uploadedFiles, maxFiles, maxFileSize, allowedTypes, onChange]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || readOnly) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, readOnly, handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      onChange(newFiles.map(f => f.file));
      return newFiles;
    });
  }, [onChange]);

  // Get file icon
  const getFileIcon = (file: File) => {
    if (isImageFile(file.name)) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    } else if (isPdfFile(file.name)) {
      return <DocumentIcon className="h-8 w-8 text-red-500" />;
    } else {
      return <DocumentIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className={cn("space-y-2", className)} style={style}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Upload area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed",
          readOnly && "cursor-default"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          ...styling,
          width: styling?.width,
          height: styling?.height,
        }}
      >
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label
            htmlFor="file-upload"
            className={cn(
              "cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              disabled && "cursor-not-allowed",
              readOnly && "cursor-default"
            )}
          >
            اختر الملفات
          </label>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            multiple={maxFiles > 1}
            accept={allowedTypes.join(',')}
            onChange={handleFileInputChange}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={disabled}
            readOnly={readOnly}
            className="sr-only"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          أو اسحب الملفات هنا
        </p>
        <p className="text-xs text-gray-400">
          الحد الأقصى {maxFiles} ملف، حجم كل ملف {formatFileSize(maxFileSize)}
        </p>
      </div>

      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            الملفات المرفوعة ({uploadedFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className={cn(
                  "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md",
                  uploadedFile.error && "bg-red-50 dark:bg-red-900"
                )}
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="h-8 w-8 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(uploadedFile.file)
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    {uploadedFile.error && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {uploadedFile.error}
                      </p>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help text */}
      {helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
