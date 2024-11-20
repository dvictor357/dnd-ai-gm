# DnD AI Master - Backend

This is the backend service for the DnD AI Master project, built with NestJS. It provides the server-side logic, AI integration, and WebSocket communication for the DnD game master assistant.

## Tech Stack

- **Framework:** NestJS 10
- **Runtime:** Node.js with TypeScript
- **WebSocket:** Socket.io
- **HTTP Client:** Axios
- **AI Integration:** 
  - Deepseek API
  - OpenRouter API
- **Database:** PostgreSQL
- **Configuration:** @nestjs/config

## Getting Started

### Prerequisites

- Bun (latest version)
- Node.js 18+ (for some dev tools)
- PostgreSQL database server

### Environment Setup

1. Copy the environment example file:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:
```env
# Server Configuration
PORT=3000

# Deepseek API Configuration
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# OpenRouter API Configuration
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=gryphe/mythomax-l2-13b:free

# AI Model Selection (options: deepseek, openrouter)
AI_MODEL=openrouter

# Database Configuration
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dnd_game
```

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Start development server with hot-reload
bun run start:dev

# Start development server with debugging
bun run start:debug

# Start production server
bun run start:prod
```

### Testing

```bash
# Unit tests
bun run test

# e2e tests
bun run test:e2e

# Test coverage
bun run test:cov
```

### Code Quality

```bash
# Run ESLint
bun run lint

# Format code
bun run format
```

## Project Structure

- `/src` - Source code
  - `/ai` - AI model integrations
  - `/game` - Game logic and state management
  - `/websocket` - WebSocket gateways and events
  - `/config` - Configuration modules
  - `/types` - TypeScript type definitions
  - `/utils` - Utility functions
  - `/database` - Database models and migrations

## Features

- Real-time communication via WebSocket
- AI-powered game master responses
- Multiple AI model support (Deepseek, OpenRouter)
- Game state management
- Persistent storage with PostgreSQL
- Environment-based configuration
- Comprehensive testing setup
- TypeScript type safety

## API Documentation

The API documentation is available at `/api` when running the development server. It provides detailed information about available endpoints and WebSocket events.

## Contributing

1. Ensure all tests pass
2. Follow the existing code style
3. Add tests for new features
4. Update documentation as needed
