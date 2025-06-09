export async function GET() {
    try {
        // Add timeout to the request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch('http://localhost:11434/api/tags', {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
            }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            if (response.status === 404) {
                return new Response(JSON.stringify({
                    error: "Ollama API not found. Make sure Ollama is running on port 11434.",
                    models: []
                }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                })
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.models || !Array.isArray(data.models)) {
            return new Response(JSON.stringify({
                error: "Invalid response from Ollama. No models data found.",
                models: []
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            })
        }

        if (data.models.length === 0) {
            return new Response(JSON.stringify({
                error: "No models installed in Ollama. Try 'ollama pull <model-name>' to install a model.",
                models: []
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        }

        // Extract model names and details with better formatting
        const models = data.models.map((model: any) => ({
            name: model.name,
            model: model.model,
            size: model.size,
            modified_at: model.modified_at,
            parameter_size: model.details?.parameter_size || 'Unknown',
            quantization: model.details?.quantization_level || 'Unknown',
            family: model.details?.family || 'Unknown'
        }))

        // Sort models by name for consistent ordering
        models.sort((a: any, b: any) => a.name.localeCompare(b.name))

        return new Response(JSON.stringify({
            models,
            total: models.length,
            timestamp: new Date().toISOString()
        }), {
            headers: { "Content-Type": "application/json" },
        })
    } catch (error) {
        console.error("Error fetching Ollama models:", error)

        let errorMessage = "Failed to connect to Ollama"

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                errorMessage = "Request timeout. Make sure Ollama is running and responding."
            } else if (error.message.includes('ECONNREFUSED')) {
                errorMessage = "Connection refused. Make sure Ollama is running on localhost:11434."
            } else if (error.message.includes('fetch')) {
                errorMessage = "Network error. Check if Ollama is accessible."
            } else {
                errorMessage = `Error: ${error.message}`
            }
        }

        return new Response(JSON.stringify({
            error: errorMessage,
            models: [],
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
} 