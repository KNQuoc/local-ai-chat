import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

// Configure for local AI model (e.g., Ollama)
const localAI = createOpenAI({
  baseURL: "http://localhost:11434/v1", // Ollama default URL
  apiKey: "ollama", // Ollama doesn't require a real API key
})

export async function POST(req: Request) {
  const { messages, model = "llama3.1:8b", maxTokens = 8192, fileContext } = await req.json()

  // If we have file context, prepend it to the last user message
  let processedMessages = messages
  let systemMessage = "You are a helpful AI assistant running locally. Be concise and helpful."

  if (fileContext && fileContext.trim()) {
    systemMessage = "You are a helpful AI assistant running locally. Be concise and helpful. The user has uploaded file(s) whose content is provided in their message. ALWAYS acknowledge that you can see the uploaded file content and use that information to provide accurate and contextual responses based on the file content."

    processedMessages = messages.map((msg: any, index: number) => {
      if (msg.role === 'user' && index === messages.length - 1) {
        // Add file context to the last user message with clearer formatting
        return {
          ...msg,
          content: `[UPLOADED FILE CONTENT START]
${fileContext}
[UPLOADED FILE CONTENT END]

Based on the uploaded file content above, please respond to this question: ${msg.content}`
        }
      }
      return msg
    })

    // Add debug logging
    console.log('File context received:', fileContext.length, 'characters')
    console.log('Processed message with file context')
  }

  try {
    const result = await streamText({
      model: localAI(model),
      messages: processedMessages,
      system: systemMessage,
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
