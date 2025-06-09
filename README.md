# Local AI Chat Interface

A beautiful, feature-rich chat interface for interacting with local AI models through Ollama. Built with Next.js, TypeScript, and Tailwind CSS.

![Local AI Chat](https://img.shields.io/badge/AI-Local-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## ✨ Features

### 🤖 **AI Integration**
- **Local AI Models**: Connect to any Ollama model
- **Model Selection**: Switch between available models on-the-fly
- **Context Control**: Adjustable max token limits (1024-32768)
- **Real-time Responses**: Streaming AI responses

### 💬 **Conversation Management**
- **Persistent History**: Conversations saved locally
- **AI-Generated Titles**: Smart 2-3 word titles for each conversation
- **Easy Navigation**: Click to switch between conversations
- **Delete Options**: Remove unwanted conversations

### 🎨 **User Experience**
- **Light/Dark Mode**: Toggle with preference persistence
- **Responsive Design**: Works on desktop and mobile
- **Beautiful UI**: Modern, clean interface with shadcn/ui components
- **Loading States**: Smooth animations and feedback

### ⚙️ **Settings & Customization**
- **Model Browser**: View all available Ollama models with details
- **Context Configuration**: Adjust memory usage vs conversation length
- **Theme Preferences**: Dark/light mode toggle
- **Local Storage**: All data stays on your machine

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed
- **Ollama** installed and running locally
- At least one AI model downloaded in Ollama

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd local-ai-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Ollama server**
   ```bash
   ollama serve
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Setup Guide

### Ollama Setup

1. **Install Ollama**
   - Visit [ollama.ai](https://ollama.ai) for installation instructions

2. **Download Models**
   ```bash
   # Example models
   ollama pull llama3.1:8b
   ollama pull qwen2.5-coder:latest
   ollama pull mistral:latest
   ```

3. **Start Ollama Server**
   ```bash
   ollama serve
   ```
   The server runs on `http://localhost:11434` by default.

### Environment Configuration

The app automatically connects to Ollama at `localhost:11434`. No additional configuration needed!

## 📖 Usage

### Starting a Conversation
1. Click "New conversation" or start typing
2. Your message will create a new conversation automatically
3. AI responses stream in real-time

### Managing Conversations
- **Switch**: Click any conversation in the sidebar
- **Delete**: Hover over a conversation and click the trash icon
- **Retitle**: Use the "Retitle" button to regenerate AI titles

### Changing Settings
1. Click "Settings" in the sidebar
2. **Select Model**: Choose from your available Ollama models
3. **Adjust Context**: Set max tokens based on your needs
4. **Toggle Theme**: Switch between light and dark modes

### Model Information
The settings panel shows for each model:
- Model name and variant
- Parameter size (e.g., "7.6B", "14.8B")
- File size on disk
- Quantization level

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI Integration**: Vercel AI SDK with Ollama
- **Storage**: Browser localStorage
- **Language**: TypeScript

### API Endpoints
- `/api/chat` - Main chat interface with streaming
- `/api/summarize` - AI-generated conversation titles
- `/api/models` - List available Ollama models

### Project Structure
```
local-ai-chat/
├── app/
│   ├── page.tsx              # Main chat interface
│   ├── layout.tsx            # App layout
│   ├── globals.css           # Global styles
│   └── api/
│       ├── chat/route.ts     # Chat API endpoint
│       ├── summarize/route.ts # Title generation
│       └── models/route.ts   # Model listing
├── components/
│   └── ui/                   # shadcn/ui components
├── lib/
│   └── utils.ts              # Utility functions
└── ...
```

## 🎯 Features in Detail

### AI-Generated Titles
- Automatically generates concise 2-3 word titles
- Uses your local AI model for smart summarization
- Examples: "Code Debug", "Python Help", "Recipe Ideas"

### Context Token Management
- **Low (1024-2048)**: Fast, good for quick questions
- **Medium (4096-8192)**: Balanced performance and context
- **High (16384-32768)**: Long conversations, more memory usage

### Dark Mode
- System-aware theme detection
- Smooth transitions between themes
- Persistent preference storage

## 🔒 Privacy & Security

- **100% Local**: All conversations stay on your machine
- **No External APIs**: Everything runs through your local Ollama instance
- **Private Storage**: Uses browser localStorage, no cloud storage
- **Secure**: No data transmitted to external servers

## 📱 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile**: Responsive design works on all devices

## 🛠️ Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Models
Simply download them through Ollama:
```bash
ollama pull <model-name>
```
They'll automatically appear in the model selector.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) - Local AI model runtime
- [Vercel AI SDK](https://sdk.vercel.ai) - AI integration
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

**Enjoy chatting with your local AI models! 🤖✨**
