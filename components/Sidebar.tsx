import { Plus, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SavedConversation } from "@/types"
import { formatTimestamp } from "@/utils"
import { SettingsPanel } from "./SettingsPanel"

interface SidebarProps {
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  savedConversations: SavedConversation[]
  currentConversationId: string | null
  startNewConversation: () => void
  loadConversation: (conversation: SavedConversation) => void
  deleteConversation: (conversationId: string, event: React.MouseEvent) => void
  isResizing: boolean
  handleMouseDown: (e: React.MouseEvent) => void
  settingsPanelProps: any // Props for SettingsPanel
}

export const Sidebar = ({
  showSettings,
  setShowSettings,
  savedConversations,
  currentConversationId,
  startNewConversation,
  loadConversation,
  deleteConversation,
  isResizing,
  handleMouseDown,
  settingsPanelProps
}: SidebarProps) => {
  return (
    <div className="flex h-full">
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-1">
        {showSettings ? (
          <div className="flex-1 p-4">
            <SettingsPanel {...settingsPanelProps} />
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
                  savedConversations
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((conv) => (
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
      
      {/* Resize Handle */}
      <div
        className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-colors duration-200"
        onMouseDown={handleMouseDown}
        style={{
          background: isResizing ? '#3b82f6' : undefined
        }}
      />
    </div>
  )
} 