# D&D AI Game Master

An interactive multiplayer Dungeons & Dragons game with an AI-powered Game Master, built with React and FastAPI.

## Features

- Real-time multiplayer interaction via WebSocket
- Flexible AI Game Master with support for multiple models:
  - DeepSeek
  - OpenRouter (supporting various models like Claude-2, GPT-4, etc.)
- Character creation and management
- Interactive chat with dice rolling system
- Dynamic dice roll tracking and stats
- Modern React-based UI with Tailwind CSS

## Project Structure

```
dnd-ai-master/
├── app/                # FastAPI Backend
│   ├── main.py        # WebSocket server and core logic
│   └── ai_models/     # AI model implementations
├── frontend/          # React Frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   └── store/      # Zustand state management
│   ├── package.json
│   └── vite.config.js
├── requirements.txt   # Python dependencies
└── .env.example      # Environment variables template
```

## Setup

### Backend Setup
1. Create a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and configure your environment:
   ```bash
   cp .env.example .env
   ```
4. Configure your AI model in `.env`:
   ```
   # For DeepSeek:
   AI_MODEL=deepseek
   DEEPSEEK_API_KEY=your_deepseek_api_key_here

   # For OpenRouter:
   AI_MODEL=openrouter
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=your_preferred_model  # e.g., anthropic/claude-2
   ```

### Frontend Setup
1. Install Node.js dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Running the Game

1. Start the backend server:
   ```bash
   cd app
   python main.py
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## How to Play

1. Create your character using the character creation form
2. Use the chat interface to describe your actions and interact with the AI Game Master
3. When prompted, use the dice roller to make ability checks and saving throws
4. The AI Game Master will respond to your actions and guide the story
5. Track your progress with the encounter and roll counters

## AI Model Configuration

The game supports multiple AI models through different providers:

### DeepSeek
- Default model for general use
- Requires a DeepSeek API key

### OpenRouter
- Provides access to various AI models:
  - Claude-2 by Anthropic
  - GPT-4 by OpenAI
  - PaLM 2 by Google
  - And many more
- Requires an OpenRouter API key
- Configurable model selection via `OPENROUTER_MODEL` environment variable

To switch between models, update the `AI_MODEL` variable in your `.env` file:
```bash
AI_MODEL=deepseek  # For DeepSeek
# or
AI_MODEL=openrouter  # For OpenRouter
```

## Requirements

- Python 3.8+
- Node.js 16+
- API key for your chosen AI provider (DeepSeek or OpenRouter)
- Modern web browser

## Development

- Backend: FastAPI with WebSocket for real-time communication
- Frontend: React 18 with Vite and Tailwind CSS
- State Management: Zustand
- AI Integration: Modular system supporting multiple AI providers

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License
