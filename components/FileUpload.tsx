import React, { useCallback, useState } from 'react'
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadedFile } from '@/types'

interface FileUploadProps {
  uploadedFiles: UploadedFile[]
  isUploading: boolean
  onFileUpload: (file: File) => void
  onFileRemove: (fileId: string) => void
  onClearAll: () => void
}

export const FileUpload = ({ 
  uploadedFiles, 
  isUploading, 
  onFileUpload, 
  onFileRemove, 
  onClearAll 
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => {
      onFileUpload(file)
    })
  }, [onFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      onFileUpload(file)
    })
    // Reset input value to allow uploading the same file again
    e.target.value = ''
  }, [onFileUpload])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: UploadedFile) => {
    switch (file.status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const supportedFormats = [
    'PDF (.pdf)',
    'Text (.txt)',
    'Word (.docx)',
    'Markdown (.md)',
    'JSON (.json)',
    'CSV (.csv)'
  ]

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          multiple
          accept=".pdf,.txt,.docx,.md,.json,.csv,text/*"
          disabled={isUploading}
        />
        
        <div className="text-center">
          <Upload className={`mx-auto h-8 w-8 ${
            isDragOver ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Click to upload</span> or drag and drop files here
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Supported: {supportedFormats.join(', ')}
          </p>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            {uploadedFiles.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(file.size)}</span>
                      {file.status === 'ready' && file.content && (
                        <span>• {file.content.length} chars</span>
                      )}
                      {file.status === 'error' && file.error && (
                        <span className="text-red-500">• {file.error}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFileRemove(file.id)}
                  className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Context Summary */}
          {uploadedFiles.some(f => f.status === 'ready') && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Context Ready:</strong> {uploadedFiles.filter(f => f.status === 'ready').length} file(s) 
                will be included in your next message for additional context.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 