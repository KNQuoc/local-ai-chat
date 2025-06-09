export async function GET() {
    try {
        const response = await fetch('http://localhost:11434/api/tags')

        if (!response.ok) {
            throw new Error('Failed to fetch models from Ollama')
        }

        const data = await response.json()

        // Extract model names and details
        const models = data.models.map((model: any) => ({
            name: model.name,
            model: model.model,
            size: model.size,
            modified_at: model.modified_at,
            parameter_size: model.details?.parameter_size || 'Unknown',
            quantization: model.details?.quantization_level || 'Unknown'
        }))

        return new Response(JSON.stringify({ models }), {
            headers: { "Content-Type": "application/json" },
        })
    } catch (error) {
        console.error("Error fetching Ollama models:", error)

        return new Response(JSON.stringify({
            error: "Failed to fetch models. Make sure Ollama is running.",
            models: []
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
} 