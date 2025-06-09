"use client"

import { useState, useEffect, useCallback } from "react"
import { useChat } from "ai/react"
import { Send, Plus, Settings, Menu, Trash2, Sparkles, Moon, Sun, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type SavedConversation = {
  id: string
  title: string
  messages: Array<{ id: string; role: "user" | "system" | "assistant" | "data"; content: string }>
  timestamp: string
  model: string
}

type OllamaModel = {
  name: string
  model: string
  size: number
  parameter_size: string
  quantization: string
}

type ChatSettings = {
  selectedModel: string
  maxTokens: number
}

export default function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([])
  const [settings, setSettings] = useState<ChatSettings>({
    selectedModel: "llama3.1:8b",
    maxTokens: 4096
  })
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    body: {
      model: settings.selectedModel,
      maxTokens: settings.maxTokens
    }
  })

  // Load conversations, theme, and settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chat-conversations')
    if (saved) {
      const conversations = JSON.parse(saved)
      setSavedConversations(conversations)
    }
    
    const savedTheme = localStorage.getItem('chat-theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    const savedSettings = localStorage.getItem('chat-settings')
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      setSettings(parsedSettings)
    }

    loadAvailableModels()
  }, [])

  // Load available Ollama models
  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/api/models')
      const data = await response.json()
      if (data.models) {
        setAvailableModels(data.models)
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }

  // Save current conversation whenever messages change
  useEffect(() => {
    if (messages.length > 0 && currentConversationId) {
      saveCurrentConversation()
    }
  }, [messages, currentConversationId])

  // Generate a title from the first user message
  const generateTitle = (messages: any[]) => {
    const firstUserMessage = messages.find(m => m.role === 'user')
    if (!firstUserMessage) return "New Conversation"
    
    let title = firstUserMessage.content.slice(0, 50)
    if (firstUserMessage.content.length > 50) title += "..."
    return title
  }

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
  const saveCurrentConversation = useCallback(async () => {
    if (!currentConversationId || messages.length === 0) return

    // Find existing conversation to preserve AI-generated title
    const existingConv = savedConversations.find(c => c.id === currentConversationId)
    
    let conversationTitle = existingConv?.title || generateTitle(messages)

    // Generate AI title if conversation has enough content and no existing AI title
    if (messages.length >= 2 && (!existingConv || existingConv.title === generateTitle(existingConv.messages))) {
      try {
        const aiTitle = await generateAITitle(messages)
        conversationTitle = aiTitle
      } catch (error) {
        console.error('Failed to generate AI title:', error)
      }
    }
    
    const conversation: SavedConversation = {
      id: currentConversationId,
      title: conversationTitle,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content
      })),
      timestamp: new Date().toLocaleString(),
      model: settings.selectedModel
    }

    setSavedConversations(prev => {
      const updated = prev.filter(c => c.id !== currentConversationId)
      updated.unshift(conversation)
      localStorage.setItem('chat-conversations', JSON.stringify(updated))
      return updated
    })
  }, [currentConversationId, messages, savedConversations])

  // Start a new conversation
  const startNewConversation = () => {
    const newId = Date.now().toString()
    setCurrentConversationId(newId)
    setMessages([])
    setSidebarOpen(false)
  }

  // Load a saved conversation
  const loadConversation = (conversation: SavedConversation) => {
    setCurrentConversationId(conversation.id)
    setMessages(conversation.messages)
    setSidebarOpen(false)
  }

  // Delete a conversation
  const deleteConversation = (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent loading the conversation
    
    setSavedConversations(prev => {
      const updated = prev.filter(c => c.id !== conversationId)
      localStorage.setItem('chat-conversations', JSON.stringify(updated))
      return updated
    })

    // If we're deleting the current conversation, start a new one
    if (conversationId === currentConversationId) {
      startNewConversation()
    }
  }

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
        localStorage.setItem('chat-conversations', JSON.stringify(updated))
        return updated
      })
    } catch (error) {
      console.error('Failed to generate title:', error)
    }
  }

  // Custom submit handler that creates a conversation ID if needed
  const handleChatSubmit = (e: React.FormEvent) => {
    if (!currentConversationId) {
      const newId = Date.now().toString()
      setCurrentConversationId(newId)
    }
    handleSubmit(e)
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('chat-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('chat-theme', 'light')
    }
  }

  // Update settings and save to localStorage
  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    localStorage.setItem('chat-settings', JSON.stringify(updatedSettings))
  }

  // Format model size for display
  const formatModelSize = (size: number) => {
    const gb = size / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)}GB`
  }

  const SettingsPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Settings</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="model-select" className="text-gray-700 dark:text-gray-300">AI Model</Label>
          <Select value={settings.selectedModel} onValueChange={(value) => updateSettings({ selectedModel: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {model.parameter_size} • {formatModelSize(model.size)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="max-tokens" className="text-gray-700 dark:text-gray-300">Max Context Tokens</Label>
          <Input
            id="max-tokens"
            type="number"
            value={settings.maxTokens}
            onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) || 4096 })}
            className="mt-1"
            min="1024"
            max="32768"
            step="1024"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Higher values allow longer conversations but use more memory
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDarkMode ? 'Light mode' : 'Dark mode'}
          </Button>
        </div>
      </div>
    </div>
  )

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {showSettings ? (
        <div className="flex-1 p-4">
          <SettingsPanel />
        </div>
      ) : (
        <>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              className="w-full justify-start gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={startNewConversation}
            >
              <Plus className="w-4 h-4" />
              New conversation
            </Button>
          </div>

      <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent conversations</h3>
          {savedConversations.length === 0 ? (
            <div className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No conversations yet.<br />Start chatting to see them here!
            </div>
          ) : (
            savedConversations.map((conv) => (
              <div 
                key={conv.id} 
                className={`group p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors relative ${
                  conv.id === currentConversationId ? 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600' : ''
                }`}
                onClick={() => loadConversation(conv)}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate pr-8">{conv.title}</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(conv.timestamp)}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{conv.model}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400"
                  onClick={(e) => deleteConversation(conv.id, e)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </>
      )}
      
      {showSettings && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={() => setShowSettings(false)}
          >
            ← Back to chats
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
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
                className="text-xs border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {isGeneratingSummary ? "Generating..." : "Retitle"}
              </Button>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400">Model: {settings.selectedModel} (Local)</div>
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
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-4 h-4 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                </div>
                <div className="max-w-2xl px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-12">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <form onSubmit={handleChatSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Message your local AI..."
                className="pr-12 py-3 text-base border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-gray-300 dark:disabled:bg-gray-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Your conversations are processed locally and never sent to external servers
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
