import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

// Configure for local AI model (e.g., Ollama)
const localAI = createOpenAI({
  baseURL: "http://localhost:11434/v1", // Ollama default URL
  apiKey: "ollama", // Ollama doesn't require a real API key
})

export async function POST(req: Request) {
  const { messages, model = "llama3.1:8b", maxTokens = 4096 } = await req.json()

  try {
    const result = await streamText({
      model: localAI(model),
      messages,
      system: "You are a helpful AI assistant running locally. Be concise and helpful.",
      maxTokens: maxTokens,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error calling local AI model:", error)

    // Fallback response when local model is not available
    return new Response(
      JSON.stringify({
        error: "Local AI model not available. Please ensure your local AI server is running.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
