import { useState, useEffect, useCallback, useRef } from 'react'
import { SavedConversation, ChatSettings, UploadedFile } from '@/types'
import { STORAGE_KEYS } from '@/constants'
import { generateTitle } from '@/utils'

export const useConversations = (messages: any[], settings: ChatSettings) => {
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
    const [isLoadingConversation, setIsLoadingConversation] = useState(false)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Load conversations from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
        if (saved) {
            const conversations = JSON.parse(saved)
            setSavedConversations(conversations)
        }

        // Cleanup timeout on unmount
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [])

    // Generate AI title for conversation
    const generateAITitle = async (messages: any[]): Promise<string> => {
        try {
            setIsGeneratingSummary(true)
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            })

            if (!response.ok) throw new Error('Failed to generate title')

            const data = await response.json()
            return data.title
        } catch (error) {
            console.error('Error generating title:', error)
            // Fallback to basic title
            return generateTitle(messages)
        } finally {
            setIsGeneratingSummary(false)
        }
    }

    // Save current conversation to localStorage
    const saveCurrentConversation = useCallback((conversationFiles?: UploadedFile[]) => {
        if (!currentConversationId || messages.length === 0) return

        // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // Debounce the save operation
        saveTimeoutRef.current = setTimeout(() => {
            setSavedConversations(prev => {
                // Find existing conversation to check if messages actually changed
                const existingConv = prev.find(c => c.id === currentConversationId)

                // If loading conversation, check if messages are the same (don't update timestamp)
                const hasNewMessages = !existingConv || existingConv.messages.length !== messages.length ||
                    existingConv.messages.some((msg, index) =>
                        !messages[index] || msg.content !== messages[index].content || msg.id !== messages[index].id
                    )

                // If no changes, return previous state to avoid re-render
                if (!hasNewMessages && existingConv && !conversationFiles) return prev

                let conversationTitle = existingConv?.title || generateTitle(messages)

                // Generate AI title if conversation has enough content and no existing AI title
                const shouldGenerateTitle = messages.length >= 2 && (!existingConv || existingConv.title === generateTitle(existingConv.messages))

                const conversation: SavedConversation = {
                    id: currentConversationId,
                    title: conversationTitle,
                    messages: messages.map(m => ({
                        id: m.id,
                        role: m.role,
                        content: m.content
                    })),
                    // Only update timestamp if there are actually new messages
                    timestamp: hasNewMessages ? new Date().toLocaleString() : (existingConv?.timestamp || new Date().toLocaleString()),
                    model: settings.selectedModel,
                    files: conversationFiles || existingConv?.files || []
                }

                // Generate AI title asynchronously if needed
                if (shouldGenerateTitle) {
                    generateAITitle(messages).then(aiTitle => {
                        setSavedConversations(prevConvs => {
                            const updated = prevConvs.map(conv =>
                                conv.id === currentConversationId
                                    ? { ...conv, title: aiTitle }
                                    : conv
                            )
                            localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated))
                            return updated
                        })
                    }).catch(error => {
                        console.error('Failed to generate AI title:', error)
                    })
                }

                const updated = prev.filter(c => c.id !== currentConversationId)
                // If no new messages, preserve original position; if new messages, put at top
                if (hasNewMessages) {
                    updated.unshift(conversation) // Add to beginning for new messages
                } else {
                    // Insert back at original position for just loading
                    const originalIndex = prev.findIndex(c => c.id === currentConversationId)
                    if (originalIndex >= 0) {
                        updated.splice(originalIndex, 0, conversation)
                    } else {
                        updated.push(conversation) // Fallback
                    }
                }
                localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated))
                return updated
            })
        }, 200) // 200ms debounce
    }, [currentConversationId, messages, settings.selectedModel])

    // Update files for current conversation
    const updateConversationFiles = useCallback((files: UploadedFile[]) => {
        if (!currentConversationId) return

        setSavedConversations(prev => {
            const updated = prev.map(conv =>
                conv.id === currentConversationId
                    ? { ...conv, files }
                    : conv
            )
            localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated))
            return updated
        })
    }, [currentConversationId])

    // Get files for current conversation
    const getCurrentConversationFiles = useCallback((): UploadedFile[] => {
        if (!currentConversationId) return []
        const conversation = savedConversations.find(c => c.id === currentConversationId)
        return conversation?.files || []
    }, [currentConversationId, savedConversations])

    // Generate AI title for current conversation
    const generateTitleForCurrent = async () => {
        if (!currentConversationId || messages.length < 1) return

        try {
            const aiTitle = await generateAITitle(messages)

            setSavedConversations(prev => {
                const updated = prev.map(conv =>
                    conv.id === currentConversationId
                        ? { ...conv, title: aiTitle }
                        : conv
                )
                localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated))
                return updated
            })
        } catch (error) {
            console.error('Failed to generate title:', error)
        }
    }

    // Delete a conversation
    const deleteConversation = (conversationId: string, event: React.MouseEvent) => {
        event.stopPropagation() // Prevent loading the conversation

        setSavedConversations(prev => {
            const updated = prev.filter(c => c.id !== conversationId)
            localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated))
            return updated
        })

        // If we're deleting the current conversation, clear current id
        if (conversationId === currentConversationId) {
            setCurrentConversationId(null)
        }
    }

    return {
        currentConversationId,
        setCurrentConversationId,
        savedConversations,
        setSavedConversations,
        isGeneratingSummary,
        isLoadingConversation,
        setIsLoadingConversation,
        saveCurrentConversation,
        generateTitleForCurrent,
        deleteConversation,
        updateConversationFiles,
        getCurrentConversationFiles
    }
} 