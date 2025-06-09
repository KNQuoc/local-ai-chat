import { RefreshCw, AlertCircle, Sun, Moon, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { OllamaModel, ChatSettings } from "@/types"
import { formatModelSize } from "@/utils"

interface SettingsPanelProps {
  settings: ChatSettings
  updateSettings: (newSettings: Partial<ChatSettings>) => void
  availableModels: OllamaModel[]
  modelsLoading: boolean
  modelsError: string | null
  loadAvailableModels: () => void
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export const SettingsPanel = ({
  settings,
  updateSettings,
  availableModels,
  modelsLoading,
  modelsError,
  loadAvailableModels,
  isDarkMode,
  toggleDarkMode
}: SettingsPanelProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadAvailableModels()}
          disabled={modelsLoading}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <RefreshCw className={`w-4 h-4 ${modelsLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="model-select" className="text-gray-700 dark:text-gray-300">AI Model</Label>
            {modelsLoading && (
              <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
            )}
          </div>
          
          {modelsError ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{modelsError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadAvailableModels()}
                className="mt-2 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700"
              >
                Retry
              </Button>
            </div>
          ) : availableModels.length === 0 && !modelsLoading ? (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No models found. Make sure Ollama is running and you have models installed.</span>
              </div>
            </div>
          ) : (
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
                        {model.parameter_size} • {formatModelSize(model.size)} • {model.quantization}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {availableModels.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {availableModels.length} model{availableModels.length !== 1 ? 's' : ''} available • Auto-refreshes every 10s
            </p>
          )}
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

        {/* Image Generation Settings */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Image Generation</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-provider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Provider
              </Label>
              <Select 
                value={settings.imageGeneration.provider} 
                onValueChange={(value: 'stable-diffusion' | 'openai' | 'replicate') => 
                  updateSettings({ 
                    imageGeneration: { 
                      ...settings.imageGeneration, 
                      provider: value 
                    } 
                  })
                }
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select image provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable-diffusion">Stable Diffusion (Local)</SelectItem>
                  <SelectItem value="openai">OpenAI DALL-E</SelectItem>
                  <SelectItem value="replicate">Replicate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.imageGeneration.provider === 'stable-diffusion' && (
              <div>
                <Label htmlFor="sd-url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stable Diffusion URL
                </Label>
                <Input
                  id="sd-url"
                  type="url"
                  value={settings.imageGeneration.stableDiffusionUrl}
                  onChange={(e) => updateSettings({ 
                    imageGeneration: { 
                      ...settings.imageGeneration, 
                      stableDiffusionUrl: e.target.value 
                    } 
                  })}
                  placeholder="http://localhost:7860"
                  className="mt-1"
                />
              </div>
            )}

            {settings.imageGeneration.provider === 'openai' && (
              <div>
                <Label htmlFor="openai-key" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  OpenAI API Key
                </Label>
                <Input
                  id="openai-key"
                  type="password"
                  value={settings.imageGeneration.openaiApiKey}
                  onChange={(e) => updateSettings({ 
                    imageGeneration: { 
                      ...settings.imageGeneration, 
                      openaiApiKey: e.target.value 
                    } 
                  })}
                  placeholder="sk-..."
                  className="mt-1"
                />
              </div>
            )}

            {settings.imageGeneration.provider === 'replicate' && (
              <div>
                <Label htmlFor="replicate-key" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Replicate API Key
                </Label>
                <Input
                  id="replicate-key"
                  type="password"
                  value={settings.imageGeneration.replicateApiKey}
                  onChange={(e) => updateSettings({ 
                    imageGeneration: { 
                      ...settings.imageGeneration, 
                      replicateApiKey: e.target.value 
                    } 
                  })}
                  placeholder="r8_..."
                  className="mt-1"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image-size" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Image Size
                </Label>
                <Select 
                  value={settings.imageGeneration.defaultSize} 
                  onValueChange={(value) => 
                    updateSettings({ 
                      imageGeneration: { 
                        ...settings.imageGeneration, 
                        defaultSize: value 
                      } 
                    })
                  }
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512x512">512×512</SelectItem>
                    <SelectItem value="768x768">768×768</SelectItem>
                    <SelectItem value="1024x1024">1024×1024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="image-steps" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Steps (SD only)
                </Label>
                <Input
                  id="image-steps"
                  type="number"
                  min="1"
                  max="150"
                  value={settings.imageGeneration.defaultSteps}
                  onChange={(e) => updateSettings({ 
                    imageGeneration: { 
                      ...settings.imageGeneration, 
                      defaultSteps: parseInt(e.target.value) || 20 
                    } 
                  })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 