import { useState, useEffect } from 'react'
import { OllamaModel } from '@/types'

export const useModels = (showSettings: boolean, selectedModel: string, updateSettings: (settings: any) => void) => {
    const [availableModels, setAvailableModels] = useState<OllamaModel[]>([])
    const [modelsLoading, setModelsLoading] = useState(false)
    const [modelsError, setModelsError] = useState<string | null>(null)

    // Load available Ollama models with enhanced error handling
    const loadAvailableModels = async (showLoading = true) => {
        if (showLoading) setModelsLoading(true)
        setModelsError(null)

        try {
            const response = await fetch('/api/models')
            const data = await response.json()

            if (data.error) {
                setModelsError(data.error)
                setAvailableModels([])
            } else if (data.models) {
                setAvailableModels(data.models)

                // Auto-update selected model if current one is not available
                if (selectedModel && !data.models.find((m: OllamaModel) => m.name === selectedModel)) {
                    if (data.models.length > 0) {
                        // Use setTimeout to prevent infinite loops
                        setTimeout(() => {
                            updateSettings({ selectedModel: data.models[0].name })
                        }, 0)
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load models:', error)
            setModelsError('Failed to connect to Ollama. Make sure it\'s running.')
            setAvailableModels([])
        } finally {
            if (showLoading) setModelsLoading(false)
        }
    }

    // Auto-refresh models when settings panel is opened
    useEffect(() => {
        if (showSettings) {
            loadAvailableModels()

            // Set up periodic refresh when settings are open
            const interval = setInterval(() => {
                loadAvailableModels(false) // Don't show loading for background refreshes
            }, 10000) // Refresh every 10 seconds

            return () => clearInterval(interval)
        }
    }, [showSettings])

    // Load models on initial mount
    useEffect(() => {
        loadAvailableModels()
    }, [])

    return {
        availableModels,
        modelsLoading,
        modelsError,
        loadAvailableModels
    }
} 