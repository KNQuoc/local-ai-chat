import { useState, useCallback, useEffect } from 'react'
import { UploadedFile } from '@/types'

export const useFileUpload = (
    conversationFiles: UploadedFile[],
    updateConversationFiles: (files: UploadedFile[]) => void
) => {
    const [isUploading, setIsUploading] = useState(false)

    const processFile = useCallback(async (file: File): Promise<string> => {
        const fileType = file.type.toLowerCase()
        const fileName = file.name.toLowerCase()

        try {
            if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                // Process PDF
                const formData = new FormData()
                formData.append('file', file)

                const response = await fetch('/api/process-file', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error('Failed to process PDF')
                }

                const data = await response.json()
                return data.content
            } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
                // Process text file
                return await file.text()
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
                // Process DOCX
                const formData = new FormData()
                formData.append('file', file)

                const response = await fetch('/api/process-file', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error('Failed to process DOCX')
                }

                const data = await response.json()
                return data.content
            } else if (fileType.startsWith('text/') || fileName.endsWith('.md') || fileName.endsWith('.json') || fileName.endsWith('.csv')) {
                // Process other text-based files
                return await file.text()
            } else {
                throw new Error(`Unsupported file type: ${fileType}`)
            }
        } catch (error) {
            console.error('Error processing file:', error)
            throw error
        }
    }, [])

    const uploadFile = useCallback(async (file: File) => {
        const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9)

        // Create initial file entry
        const newFile: UploadedFile = {
            id: fileId,
            name: file.name,
            type: file.type || 'unknown',
            size: file.size,
            content: '',
            uploadedAt: new Date().toISOString(),
            status: 'processing'
        }

        const updatedFiles = [...conversationFiles, newFile]
        updateConversationFiles(updatedFiles)
        setIsUploading(true)

        try {
            const content = await processFile(file)

            const finalUpdatedFiles = updatedFiles.map(f =>
                f.id === fileId
                    ? { ...f, content, status: 'ready' as const }
                    : f
            )
            updateConversationFiles(finalUpdatedFiles)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            const finalUpdatedFiles = updatedFiles.map(f =>
                f.id === fileId
                    ? { ...f, status: 'error' as const, error: errorMessage }
                    : f
            )
            updateConversationFiles(finalUpdatedFiles)
        } finally {
            setIsUploading(false)
        }
    }, [conversationFiles, updateConversationFiles, processFile])

    const removeFile = useCallback((fileId: string) => {
        const updatedFiles = conversationFiles.filter(f => f.id !== fileId)
        updateConversationFiles(updatedFiles)
    }, [conversationFiles, updateConversationFiles])

    const clearAllFiles = useCallback(() => {
        updateConversationFiles([])
    }, [updateConversationFiles])

    const getFileContext = useCallback(() => {
        const readyFiles = conversationFiles.filter(f => f.status === 'ready')
        if (readyFiles.length === 0) return ''

        return readyFiles.map(file =>
            `--- Content from ${file.name} ---\n${file.content}\n--- End of ${file.name} ---`
        ).join('\n\n')
    }, [conversationFiles])

    return {
        uploadedFiles: conversationFiles,
        isUploading,
        uploadFile,
        removeFile,
        clearAllFiles,
        getFileContext
    }
} 