import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

// Configure for local AI model (e.g., Ollama)
const localAI = createOpenAI({
    baseURL: "http://localhost:11434/v1", // Ollama default URL
    apiKey: "ollama", // Ollama doesn't require a real API key
})

export async function POST(req: Request) {
    const { messages } = await req.json()

    try {
        // Format the conversation for summarization
        const conversationText = messages
            .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n\n')

        const result = await generateText({
            model: localAI("llama3.1:8b"),
            prompt: `Please provide a very short 2-3 word title for this conversation. Focus on the main topic. Examples: "Code Debug", "Python Help", "API Design", "Math Problem", "Recipe Ideas"

${conversationText}

Title (2-3 words only):`,
            maxTokens: 20,
        })

        return new Response(JSON.stringify({ title: result.text.trim() }), {
            headers: { "Content-Type": "application/json" },
        })
    } catch (error) {
        console.error("Error generating summary:", error)

        // Fallback to a simple title based on first message
        const firstUserMessage = messages.find((m: any) => m.role === 'user')
        const fallbackTitle = firstUserMessage
            ? firstUserMessage.content.split(' ').slice(0, 3).join(' ')
            : "New Chat"

        return new Response(JSON.stringify({ title: fallbackTitle }), {
            headers: { "Content-Type": "application/json" },
        })
    }
} 