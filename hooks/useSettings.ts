import { useState, useEffect } from 'react'
import { ChatSettings } from '@/types'
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/constants'

export const useSettings = () => {
    const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS)
    const [isDarkMode, setIsDarkMode] = useState(false)

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME)
        if (savedTheme === 'dark') {
            setIsDarkMode(true)
            document.documentElement.classList.add('dark')
        }

        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings)
            // Merge with default settings to ensure all new properties exist
            const mergedSettings = {
                ...DEFAULT_SETTINGS,
                ...parsedSettings,
                imageGeneration: {
                    ...DEFAULT_SETTINGS.imageGeneration,
                    ...(parsedSettings.imageGeneration || {})
                }
            }
            setSettings(mergedSettings)
        }
    }, [])

    const updateSettings = (newSettings: Partial<ChatSettings>) => {
        const updatedSettings = { ...settings, ...newSettings }
        setSettings(updatedSettings)
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings))
    }

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode
        setIsDarkMode(newDarkMode)

        if (newDarkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem(STORAGE_KEYS.THEME, 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem(STORAGE_KEYS.THEME, 'light')
        }
    }

    return {
        settings,
        isDarkMode,
        updateSettings,
        toggleDarkMode
    }
} 