# D&D AI Game Master

An interactive multiplayer Dungeons & Dragons game with an AI-powered Game Master.

## Features

- Real-time multiplayer interaction via WebSocket
- AI Game Master powered by GPT-4
- Character creation and management
- Interactive chat and action system
- Modern web interface

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the project root and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Running the Game

1. Start the server:
   ```bash
   cd app
   python main.py
   ```
2. Open your browser and navigate to `http://localhost:8000`
3. Create your character and start playing!

## How to Play

1. Enter your character details in the left panel
2. Type your actions or dialogue in the chat input
3. The AI Game Master will respond to your actions and guide the story
4. Interact with other players in real-time

## Requirements

- Python 3.8+
- OpenAI API key
- Modern web browser

## Contributing

Feel free to submit issues and enhancement requests!
