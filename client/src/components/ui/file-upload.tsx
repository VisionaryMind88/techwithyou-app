import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { X, Upload, File, AlertCircle, CheckCircle } from "lucide-react";

interface FileUploadProps {
  onFilesAdded: (files: File[]) => void;
  maxSize?: number;
  maxFiles?: number;
  acceptedTypes?: string;
  className?: string;
  uploadingFiles?: boolean;
}

export function FileUpload({
  onFilesAdded,
  maxSize = 2 * 1024 * 1024 * 1024, // 2GB default
  maxFiles = 10,
  acceptedTypes,
  className,
  uploadingFiles = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Format accepted types for better screen reader announcement
  const formattedAcceptedTypes = acceptedTypes 
    ? acceptedTypes.replace(/,/g, ', ').replace(/\./g, '') 
    : 'all file types';

  useEffect(() => {
    // Simulate upload progress if uploadingFiles is true
    if (uploadingFiles && selectedFiles.length > 0) {
      setStatusMessage("Uploading files...");
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatusMessage("Files uploaded successfully");
            
            // Clear success message after delay
            setTimeout(() => {
              setStatusMessage("");
              setUploadProgress(0);
            }, 3000);
            
            return 100;
          }
          return prev + 5;
        });
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [uploadingFiles, selectedFiles]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setStatusMessage("File hover detected. Drop to upload.");
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setStatusMessage("");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setStatusMessage(`${droppedFiles.length} files dropped. Validating...`);
    validateAndAddFiles(droppedFiles);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setStatusMessage(`${files.length} files selected. Validating...`);
      validateAndAddFiles(files);
    }
  };

  const validateAndAddFiles = (files: File[]) => {
    // Check if adding these would exceed max files
    if (selectedFiles.length + files.length > maxFiles) {
      const errorMessage = `You can only upload a maximum of ${maxFiles} files.`;
      setStatusMessage(`Error: ${errorMessage}`);
      toast({
        title: "Too many files",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Focus back on the dropzone for better keyboard navigation
      setTimeout(() => dropzoneRef.current?.focus(), 100);
      return;
    }

    let validCount = 0;
    let invalidCount = 0;
    
    // Validate file sizes and type
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        invalidCount++;
        toast({
          title: "File too large",
          description: `${file.name} exceeds the maximum file size of ${formatBytes(maxSize)}.`,
          variant: "destructive",
        });
        return false;
      }

      if (acceptedTypes && !file.type.match(acceptedTypes)) {
        invalidCount++;
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }

      validCount++;
      return true;
    });

    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      onFilesAdded(newFiles);
      
      setStatusMessage(`${validCount} file${validCount !== 1 ? 's' : ''} added successfully${invalidCount > 0 ? `, ${invalidCount} file${invalidCount !== 1 ? 's' : ''} rejected` : ''}.`);
      
      // Focus on the status message for screen readers to announce
      setTimeout(() => statusRef.current?.focus(), 100);
    } else if (invalidCount > 0) {
      setStatusMessage(`No valid files were added. ${invalidCount} file${invalidCount !== 1 ? 's were' : ' was'} rejected.`);
      
      // Focus back on the dropzone for better keyboard navigation
      setTimeout(() => dropzoneRef.current?.focus(), 100);
    }
  };

  const removeFile = (index: number, filename: string) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    onFilesAdded(newFiles);
    
    setStatusMessage(`${filename} removed. ${newFiles.length} file${newFiles.length !== 1 ? 's' : ''} remaining.`);
    
    // Focus on the status message for screen readers to announce
    setTimeout(() => statusRef.current?.focus(), 100);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className={`${className} file-upload-component`} aria-labelledby="file-upload-heading">
      <h2 id="file-upload-heading" className="sr-only">File Upload</h2>
      
      {/* Instructions for screen readers */}
      <div className="sr-only" id="file-upload-instructions">
        This is a file upload area. You can select files by clicking or pressing Enter on the upload area, 
        or by dragging and dropping files onto it. You can upload up to {maxFiles} files, 
        with a maximum size of {formatBytes(maxSize)} each. 
        {acceptedTypes ? ` Accepted file types are: ${formattedAcceptedTypes}.` : ''}
      </div>
      
      {/* Status message area for screen readers */}
      {statusMessage && (
        <div 
          ref={statusRef}
          className="px-4 py-2 mb-3 text-sm border rounded-md bg-gray-50 text-gray-800" 
          aria-live="polite"
          role="status"
          tabIndex={-1}
        >
          {uploadingFiles ? (
            <div className="flex items-center">
              <div className="mr-2">
                {uploadProgress < 100 ? (
                  <span className="loading-indicator" aria-hidden="true">⏳</span>
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                )}
              </div>
              <div>
                {statusMessage}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <span className="sr-only">
                    Upload progress: {uploadProgress}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            statusMessage
          )}
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Progress 
              value={uploadProgress} 
              max={100} 
              className="mt-2 h-2"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadProgress}
            />
          )}
        </div>
      )}

      <div
        ref={dropzoneRef}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md 
          ${isDragging ? "border-primary-500 bg-primary-50" : "border-gray-300"} 
          ${uploadingFiles ? "opacity-70 cursor-not-allowed" : "cursor-pointer focus:ring-2 focus:ring-primary-500 focus:outline-none"}
          transition-colors duration-200`}
        onDragOver={!uploadingFiles ? handleDragOver : undefined}
        onDragLeave={!uploadingFiles ? handleDragLeave : undefined}
        onDrop={!uploadingFiles ? handleDrop : undefined}
        onClick={() => !uploadingFiles && fileInputRef.current?.click()}
        role="button" 
        aria-haspopup="dialog"
        aria-describedby="file-upload-instructions"
        aria-label={uploadingFiles ? "File upload in progress" : "Click or drag files here to upload"}
        tabIndex={uploadingFiles ? -1 : 0}
        onKeyDown={(e) => {
          if (!uploadingFiles && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-disabled={uploadingFiles}
      >
        <div className="space-y-1 text-center">
          <Upload 
            className={`mx-auto h-12 w-12 ${isDragging ? "text-primary-500" : "text-gray-600"}`} 
            aria-hidden="true" 
          />
          <div className="flex flex-wrap justify-center text-sm text-gray-800">
            <label
              htmlFor="file-upload"
              className={`relative cursor-pointer bg-white rounded-md font-medium text-primary-700 hover:text-primary-600 
                focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500
                ${uploadingFiles ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              <span>Upload files</span>
              <input
                id="file-upload"
                ref={fileInputRef}
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept={acceptedTypes}
                onChange={handleFileInput}
                aria-label="Select files to upload"
                disabled={uploadingFiles}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-700">
            Support for multiple files (up to {maxFiles}) with maximum size {formatBytes(maxSize)} each
            {acceptedTypes && <span className="block mt-1">Accepted formats: {formattedAcceptedTypes}</span>}
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div 
          className="mt-4 space-y-2" 
          id="selected-files-section"
          aria-label={`${selectedFiles.length} files selected for upload`}
        >
          <h3 className="text-sm font-medium text-gray-800 flex items-center">
            <span>Selected files</span> 
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {selectedFiles.length} of {maxFiles}
            </span>
          </h3>
          <ul 
            className="divide-y divide-gray-200 border rounded-md" 
            aria-label="Selected files for upload"
            role="list"
          >
            {selectedFiles.map((file, index) => (
              <li 
                key={index} 
                className="flex items-center justify-between py-3 px-4"
                aria-labelledby={`file-name-${index}`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <File className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p 
                      id={`file-name-${index}`}
                      className="text-sm font-medium text-gray-800 truncate"
                    >
                      {file.name}
                    </p>
                    <div className="flex items-center">
                      <p 
                        className="text-xs text-gray-600" 
                        aria-label={`File size: ${formatBytes(file.size)}`}
                      >
                        {formatBytes(file.size)}
                      </p>
                      <p className="text-xs text-gray-500 ml-2">
                        <span className="sr-only">File type: </span>
                        {file.type || "Unknown type"}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index, file.name);
                  }}
                  aria-label={`Remove file: ${file.name}`}
                  className="ml-2 text-gray-500 hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  disabled={uploadingFiles}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Remove</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
