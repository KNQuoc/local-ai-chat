export const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    return `${Math.floor(diffInHours / 24)} days ago`
}

export const formatModelSize = (size: number) => {
    const gb = size / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)}GB`
}

export const generateTitle = (messages: any[]) => {
    const firstUserMessage = messages.find(m => m.role === 'user')
    if (!firstUserMessage) return "New Conversation"

    let title = firstUserMessage.content.slice(0, 50)
    if (firstUserMessage.content.length > 50) title += "..."
    return title
} 