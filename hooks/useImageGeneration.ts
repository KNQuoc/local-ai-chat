import { useState } from 'react'
import { ChatSettings } from '@/types'

export const useImageGeneration = () => {
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)

    const generateImage = async (prompt: string, settings: ChatSettings) => {
        try {
            setIsGeneratingImage(true)

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    provider: settings.imageGeneration.provider,
                    settings: settings.imageGeneration
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to generate image')
            }

            const data = await response.json()
            return data.imageUrl
        } catch (error) {
            console.error('Image generation error:', error)
            throw error
        } finally {
            setIsGeneratingImage(false)
        }
    }

    return {
        isGeneratingImage,
        generateImage
    }
} 