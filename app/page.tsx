"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { Send, Menu, Sparkles, Image, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Custom hooks
import { useSettings } from "@/hooks/useSettings"
import { useModels } from "@/hooks/useModels"
import { useConversations } from "@/hooks/useConversations"
import { useImageGeneration } from "@/hooks/useImageGeneration"
import { useSidebar } from "@/hooks/useSidebar"
import { useFileUpload } from "@/hooks/useFileUpload"

// Components
import { Sidebar } from "@/components/Sidebar"

// Types
import { SavedConversation } from "@/types"

export default function ChatInterface() {
  const [showSettings, setShowSettings] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Custom hooks
  const { settings, isDarkMode, updateSettings, toggleDarkMode } = useSettings()
  const { sidebarOpen, setSidebarOpen, sidebarWidth, isResizing, handleMouseDown } = useSidebar()

  // Initialize conversation hooks first
  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat"
  })

  const {
    currentConversationId,
    setCurrentConversationId,
    savedConversations,
    isGeneratingSummary,
    isLoadingConversation,
    setIsLoadingConversation,
    saveCurrentConversation,
    generateTitleForCurrent,
    deleteConversation,
    updateConversationFiles,
    getCurrentConversationFiles
  } = useConversations(messages, settings)

  const currentFiles = getCurrentConversationFiles()
  
  const { 
    isUploading, 
    uploadFile, 
    removeFile, 
    clearAllFiles, 
    getFileContext 
  } = useFileUpload(currentFiles, updateConversationFiles)

  // Custom submit with file context
  const handleSubmit = (e: React.FormEvent) => {
    const fileContext = getFileContext()
    console.log('Current files:', currentFiles)
    console.log('Ready files:', currentFiles.filter(f => f.status === 'ready'))
    console.log('Generated file context:', fileContext)
    console.log('File context length:', fileContext.length)
    
    // Update the chat body with current file context
    originalHandleSubmit(e, {
      body: {
        model: settings.selectedModel,
        maxTokens: settings.maxTokens,
        fileContext: fileContext
      }
    })
  }

  const { availableModels, modelsLoading, modelsError, loadAvailableModels } = useModels(
    showSettings, 
    settings.selectedModel, 
    updateSettings
  )

  const { isGeneratingImage, generateImage } = useImageGeneration()

  // Create a conversation ID on app load if none exists and there are no saved conversations
  useEffect(() => {
    if (!currentConversationId && savedConversations.length === 0) {
      const newId = Date.now().toString()
      setCurrentConversationId(newId)
    }
  }, [currentConversationId, savedConversations.length, setCurrentConversationId])

  // Save current conversation whenever messages change (but not when just loading)
  useEffect(() => {
    if (messages.length > 0 && currentConversationId && !isLoadingConversation) {
      saveCurrentConversation()
    }
  }, [messages, currentConversationId, isLoadingConversation, saveCurrentConversation])

  // Auto-scroll to bottom when shouldAutoScroll is true and messages change
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 50)
      
      return () => clearTimeout(timeoutId)
    }
  }, [messages, shouldAutoScroll])

  // Handle input focus - create conversation ID if needed
  const handleInputFocus = () => {
    if (!currentConversationId) {
      const newId = Date.now().toString()
      setCurrentConversationId(newId)
    }
  }

  // Start a new conversation
  const startNewConversation = () => {
    const newId = Date.now().toString()
    setCurrentConversationId(newId)
    setMessages([])
    setSidebarOpen(false)
    setShowFileUpload(false)
  }

  // Load a saved conversation
  const loadConversation = (conversation: SavedConversation) => {
    setIsLoadingConversation(true)
    setShouldAutoScroll(false)
    setCurrentConversationId(conversation.id)
    setMessages(conversation.messages)
    setSidebarOpen(false)
    setShowFileUpload(false)
    
    setTimeout(() => {
      setShouldAutoScroll(true)
      setIsLoadingConversation(false)
    }, 500)
  }

  // Custom submit handler that creates a conversation ID if needed
  const handleChatSubmit = (e: React.FormEvent) => {
    setShouldAutoScroll(true)
    if (!currentConversationId) {
      const newId = Date.now().toString()
      setCurrentConversationId(newId)
    }
    handleSubmit(e)
  }

  // Handle image generation
  const handleImageGeneration = async () => {
    if (!input.trim()) return
    
    setShouldAutoScroll(true)
    
    try {
      const imageUrl = await generateImage(input, settings)
      
      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: `Generate image: ${input}`
      }
      
      const imageMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `![Generated Image](${imageUrl})`
      }
      
      setMessages([...messages, userMessage, imageMessage])
      handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
      
      if (!currentConversationId) {
        const newId = Date.now().toString()
        setCurrentConversationId(newId)
      }
    } catch (error) {
      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: `Generate image: ${input}`
      }
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Sorry, I couldn't generate an image: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      
      setMessages([...messages, userMessage, errorMessage])
      handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  // Settings panel props
  const settingsPanelProps = {
    settings,
    updateSettings,
    availableModels,
    modelsLoading,
    modelsError,
    loadAvailableModels,
    isDarkMode,
    toggleDarkMode
  }

  // Sidebar props
  const sidebarProps = {
    showSettings,
    setShowSettings,
    savedConversations,
    currentConversationId,
    startNewConversation,
    loadConversation,
    deleteConversation,
    isResizing,
    handleMouseDown,
    settingsPanelProps,
    // File upload props
    currentFiles,
    isUploading,
    onFileUpload: uploadFile,
    onFileRemove: removeFile,
    onClearAllFiles: clearAllFiles,
    showFileUpload,
    setShowFileUpload
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div 
        className="hidden md:block"
        style={{ width: `${sidebarWidth}px` }}
      >
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden text-gray-600 dark:text-gray-300">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Local AI Assistant</h1>
          </div>
          <div className="flex items-center gap-3">
            {messages.length >= 1 && currentConversationId && (
              <Button
                variant="outline"
                size="sm"
                onClick={generateTitleForCurrent}
                disabled={isGeneratingSummary}
                className="text-xs border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {isGeneratingSummary ? "Generating..." : "Retitle"}
              </Button>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Model: {settings.selectedModel} (Local)
              {modelsLoading && <span className="ml-1">🔄</span>}
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">How can I help you today?</h2>
                <p className="text-gray-500 dark:text-gray-400">Start a conversation with your local AI model</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                    </div>
                  )}
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-2xl ${
                      message.role === "user" ? "bg-blue-600 dark:bg-blue-700 text-white ml-12" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-12"
                    }`}
                  >
                    {message.content.includes('![Generated Image](') ? (
                      <div className="space-y-2">
                        {message.content.split('\n').map((line, index) => {
                          if (line.startsWith('![Generated Image](') && line.endsWith(')')) {
                            const imageUrl = line.slice(19, -1)
                            return (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                key={index}
                                src={imageUrl} 
                                alt="Generated Image" 
                                className="max-w-full h-auto rounded-lg shadow-md"
                                style={{ maxHeight: '400px' }}
                              />
                            )
                          }
                          return line ? <div key={index} className="whitespace-pre-wrap">{line}</div> : null
                        })}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))
            )}
            {(isLoading || isGeneratingImage) && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-4 h-4 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                </div>
                <div className="max-w-2xl px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-12">
                  <div className="flex items-center gap-2">
                    {isGeneratingImage ? (
                      <>
                        <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm">Generating image...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <form onSubmit={handleChatSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder={
                  currentFiles.filter(f => f.status === 'ready').length > 0 
                    ? `Ask about your uploaded files or anything else...`
                    : "Message your local AI or describe an image to generate..."
                }
                className="pr-20 py-3 text-base border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isLoading || isGeneratingImage}
                onFocus={handleInputFocus}
              />
              <div className="absolute right-2 flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleImageGeneration}
                  disabled={!input.trim() || isLoading || isGeneratingImage}
                  className="w-8 h-8 p-0 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  title="Generate Image"
                >
                  {isGeneratingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Image className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading || isGeneratingImage}
                  className="w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Chat with AI, upload files per conversation, or generate images • All processing happens locally
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

