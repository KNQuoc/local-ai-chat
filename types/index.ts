export type SavedConversation = {
    id: string
    title: string
    messages: Array<{ id: string; role: "user" | "system" | "assistant" | "data"; content: string }>
    timestamp: string
    model: string
    files?: UploadedFile[]
}

export type OllamaModel = {
    name: string
    model: string
    size: number
    parameter_size: string
    quantization: string
}

export type ChatSettings = {
    selectedModel: string
    maxTokens: number
    imageGeneration: {
        provider: 'stable-diffusion' | 'openai' | 'replicate'
        stableDiffusionUrl: string
        openaiApiKey: string
        replicateApiKey: string
        defaultSize: string
        defaultSteps: number
    }
}

export type UploadedFile = {
    id: string
    name: string
    type: string
    size: number
    content: string
    uploadedAt: string
    status: 'processing' | 'ready' | 'error'
    error?: string
} 