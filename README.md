# DnD AI Master

An AI-powered Dungeons & Dragons game master assistant that helps create and run immersive tabletop RPG experiences.

## Project Overview

This is a monorepo project consisting of:
- A React-based frontend for player interaction
- A NestJS backend for game logic and AI integration
- Real-time communication via WebSocket
- Multiple AI model integrations for dynamic storytelling

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS
- Three.js for 3D visualization
- Socket.io Client
- Zustand for state management

### Backend
- NestJS 10
- Socket.io for WebSocket
- PostgreSQL database
- Multiple AI integrations:
  - Deepseek API
  - OpenRouter API

### Development Tools
- Bun as package manager
- TypeScript
- ESLint + Prettier
- Jest for testing

## Getting Started

### Prerequisites

- Bun (latest version)
- Node.js 18+
- PostgreSQL database server
- AI API keys (Deepseek and/or OpenRouter)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dnd-ai-master.git
cd dnd-ai-master
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
# Frontend
cd frontend
cp .env.example .env

# Backend
cd ../backend
cp .env.example .env
```

4. Configure your environment variables:
- Frontend `.env`:
  ```
  VITE_WS_HOST=localhost:3000
  ```
- Backend `.env`:
  ```
  PORT=3000
  DEEPSEEK_API_KEY=your-deepseek-api-key
  OPENROUTER_API_KEY=your-openrouter-api-key
  OPENROUTER_MODEL=gryphe/mythomax-l2-13b:free
  AI_MODEL=openrouter
  POSTGRES_USER=your_postgres_user
  POSTGRES_PASSWORD=your_postgres_password
  POSTGRES_SERVER=localhost
  POSTGRES_PORT=5432
  POSTGRES_DB=dnd_game
  ```

### Development

Start the development servers:

```bash
# From the root directory
bun run dev
```

This will start both frontend and backend in development mode:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API Documentation: http://localhost:3000/api

## Project Structure

```
dnd-ai-master/
├── frontend/           # React frontend application
│   ├── src/           # Source files
│   ├── public/        # Static files
│   └── README.md      # Frontend documentation
├── backend/           # NestJS backend application
│   ├── src/          # Source files
│   │   ├── ai/       # AI model integrations
│   │   ├── game/     # Game logic
│   │   └── websocket/# WebSocket handlers
│   └── README.md     # Backend documentation
└── package.json      # Root package.json for workspace management
```

## Features

- Real-time game state synchronization
- AI-powered storytelling and NPC interactions
- Dynamic 3D visualization capabilities
- Multiple AI model support
- Persistent game state storage
- Responsive and modern UI
- WebSocket-based communication

## Testing

```bash
# Frontend tests
cd frontend
bun run test

# Backend tests
cd backend
bun run test
bun run test:e2e
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please ensure you:
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Make atomic commits with clear messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- NestJS team for the excellent backend framework
- React team for the frontend framework
- AI model providers for their APIs
- The D&D community for inspiration
