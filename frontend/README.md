# DnD AI Master - Frontend

This is the frontend application for the DnD AI Master project, built with React and Vite. It provides an interactive interface for playing Dungeons & Dragons with AI assistance.

## Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with Typography and Forms plugins
- **State Management:** Zustand
- **3D Graphics:** Three.js
- **Routing:** React Router DOM
- **WebSocket:** Socket.io Client
- **Markdown:** React Markdown
- **UI Components:** 
  - React Virtuoso for virtual lists
  - Heroicons for icons

## Getting Started

### Prerequisites

- Bun (latest version)
- Node.js 18+ (for some dev tools)

### Environment Setup

1. Copy the environment example file:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:
```
VITE_WS_HOST=localhost:3000
```

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Start development server
bun run dev
```

The development server will start on `http://localhost:5173` with hot module replacement (HMR) enabled.

### Building for Production

```bash
# Create production build
bun run build

# Preview production build
bun run preview
```

### Code Quality

```bash
# Run ESLint
bun run lint
```

## Project Structure

- `/src` - Source code
  - `/components` - React components
  - `/hooks` - Custom React hooks
  - `/store` - Zustand state management
  - `/styles` - Tailwind CSS styles
  - `/utils` - Utility functions
  - `/pages` - Route pages
  - `/assets` - Static assets

## Features

- Real-time communication with backend via WebSocket
- 3D visualization capabilities with Three.js
- Responsive design with Tailwind CSS
- Virtual scrolling for efficient list rendering
- Markdown support for rich text content
- Client-side routing
- State management with Zustand
