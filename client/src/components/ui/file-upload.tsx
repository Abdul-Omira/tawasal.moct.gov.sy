import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, AlertCircle, FileType, Check, Paperclip } from 'lucide-react';

// Define file upload properties
export interface FileUploadProps {
  onFileUploaded: (fileData: {
    url: string;
    name: string;
    type: string;
    size: number;
  }) => void;
  onUploadError: (error: string) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

const defaultAllowedTypes = [
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

const FILE_TYPE_LIMITS = {
  'image/jpeg': 5,
  'image/png': 5,
  'image/gif': 5,
  'application/pdf': 10,
  'application/msword': 10,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10,
  'application/vnd.ms-powerpoint': 10,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 10,
  'text/plain': 2
};

export function FileUpload({
  onFileUploaded,
  onUploadError,
  maxSizeMB = 5,
  allowedTypes = defaultAllowedTypes
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Format file size to human readable format
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  // Enhanced file validation with specific type limits
  const validateFile = (file: File): boolean => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      setError(`نوع الملف غير مسموح به. يُسمح بالصور (JPG, PNG, GIF) والمستندات (PDF, Word, PowerPoint) والملفات النصية فقط`);
      return false;
    }
    
    // Check file extension for additional security
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      setError(`امتداد الملف غير مسموح به: ${fileExtension}`);
      return false;
    }
    
    // Check file size based on type-specific limits
    const typeLimit = FILE_TYPE_LIMITS[file.type as keyof typeof FILE_TYPE_LIMITS] || maxSizeMB;
    const maxSizeBytes = typeLimit * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`حجم الملف يتجاوز الحد المسموح به لهذا النوع (${typeLimit} ميجابايت)`);
      return false;
    }
    
    // Additional security checks
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.js', '.php', '.jsp', '.asp'];
    if (dangerousExtensions.includes(fileExtension)) {
      setError('نوع الملف خطير وغير مسموح');
      return false;
    }
    
    return true;
  };
  
  // Generate image preview for supported formats
  const generateImagePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setUploaded(false);
    setImagePreview(null);
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (validateFile(file)) {
      setSelectedFile(file);
      generateImagePreview(file);
    } else {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('attachment', selectedFile);
    
    try {
      // Simulate progress (in a real implementation, this would use XMLHttpRequest)
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 10;
          if (progress >= 90) {
            clearInterval(interval);
          } else {
            setUploadProgress(Math.min(progress, 90));
          }
        }, 300);
        return interval;
      };
      
      const progressInterval = simulateProgress();
      
      // Send file to server with enhanced error handling
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'فشل تحميل الملف';
        
        // Handle specific security errors
        switch (errorData.error) {
          case 'MIME_TYPE_MISMATCH':
            errorMessage = 'نوع الملف الحقيقي لا يطابق امتداده';
            break;
          case 'DANGEROUS_EXTENSION':
            errorMessage = 'امتداد الملف خطير وغير مسموح';
            break;
          case 'MALICIOUS_CONTENT':
            errorMessage = 'تم اكتشاف محتوى خطير في الملف';
            break;
          case 'SIZE_MISMATCH':
            errorMessage = 'حجم الملف غير متطابق';
            break;
          default:
            errorMessage = errorData.message || 'فشل تحميل الملف';
        }
        
        throw new Error(errorMessage);
      }
      
      setUploadProgress(100);
      
      const data = await response.json();
      
      // Notify parent component of successful upload
      const fileData = {
        url: data.file.path,
        name: data.file.originalname,
        type: data.file.mimetype,
        size: data.file.size
      };
      
      onFileUploaded(fileData);
      
      setUploaded(true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل الملف';
      setError(errorMessage);
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle file removal
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    setUploaded(false);
    setUploadProgress(0);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Get security status indicator
  const getSecurityStatus = () => {
    if (uploaded) {
      return (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <Check className="h-4 w-4" />
          <span>تم التحميل بنجاح</span>
        </div>
      );
    }
    return null;
  };
  
  // Get file icon based on mime type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    return '📎';
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-2">
        <div 
          className={`border-2 border-dashed rounded-md p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer 
                      ${error ? 'border-red-400' : (uploaded ? 'border-green-400' : 'border-gray-300')}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={allowedTypes.join(',')}
          />
          
          {!selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                انقر هنا لاختيار ملف أو اسحب الملف وأفلته هنا
              </p>
              <p className="text-xs text-muted-foreground">
                الأنواع المسموح بها: JPG, PNG, PDF, DOC, DOCX, TXT | الحد الأقصى: {maxSizeMB} MB
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File info and controls */}
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getFileIcon(selectedFile.type)}</span>
                  <div className="text-start">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                {!uploaded ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Check className="h-5 w-5 text-green-600" />
                )}
              </div>
              
              {/* Image preview */}
              {imagePreview && (
                <div className="mt-3">
                  <img 
                    src={imagePreview} 
                    alt="معاينة الصورة" 
                    className="max-h-32 max-w-full object-contain rounded border"
                  />
                </div>
              )}
            </div>
          )}
        </div>
        
        {selectedFile && !uploaded && !isUploading && (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleUpload();
            }}
            className="w-full sm:w-auto"
            disabled={isUploading || !selectedFile}
          >
            <Paperclip className="ml-2 h-4 w-4" />
            تحميل الملف
          </Button>
        )}
        
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>جاري تحميل الملف...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mr-2">{error}</AlertDescription>
          </Alert>
        )}

        {/* Security status indicator */}
        {getSecurityStatus()}

        {/* Simple security notice */}
        {selectedFile && (
          <div className="text-xs text-muted-foreground text-center">
            الملفات محمية بفحص أمني
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUpload;