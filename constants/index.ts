import { ChatSettings } from '@/types'

export const DEFAULT_SETTINGS: ChatSettings = {
    selectedModel: "llama3.1:8b",
    maxTokens: 4096,
    imageGeneration: {
        provider: 'stable-diffusion',
        stableDiffusionUrl: 'http://localhost:7860',
        openaiApiKey: '',
        replicateApiKey: '',
        defaultSize: '512x512',
        defaultSteps: 20
    }
}

export const SIDEBAR_CONFIG = {
    DEFAULT_WIDTH: 320,
    MIN_WIDTH: 240,
    MAX_WIDTH: 600
}

export const STORAGE_KEYS = {
    CONVERSATIONS: 'chat-conversations',
    THEME: 'chat-theme',
    SETTINGS: 'chat-settings',
    SIDEBAR_WIDTH: 'sidebar-width'
} 