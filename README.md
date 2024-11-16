# D&D AI Game Master

An interactive multiplayer Dungeons & Dragons game with an AI-powered Game Master, built with React and FastAPI.

## Features

- Real-time multiplayer interaction via WebSocket
- AI Game Master powered by DeepSeek
- Character creation and management
- Interactive chat with dice rolling system
- Dynamic dice roll tracking and stats
- Modern React-based UI with Tailwind CSS

## Project Structure

```
dnd-ai-master/
├── app/                # FastAPI Backend
│   └── main.py        # WebSocket server and AI integration
├── frontend/          # React Frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   └── store/      # Zustand state management
│   ├── package.json
│   └── vite.config.js
├── requirements.txt   # Python dependencies
└── .env              # Environment variables
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
3. Create a `.env` file in the project root:
   ```
   DEEPSEEK_API_KEY=your_api_key_here
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

## Requirements

- Python 3.8+
- Node.js 16+
- DeepSeek API key
- Modern web browser

## Development

- Backend: FastAPI with WebSocket for real-time communication
- Frontend: React 18 with Vite and Tailwind CSS
- State Management: Zustand
- AI Integration: DeepSeek Chat API

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License
