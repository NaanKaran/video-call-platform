# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a video call platform built with a monorepo structure containing:
- **Backend**: TypeScript Express server with MongoDB/Mongoose, using TypeScript Express Starter architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS

The project follows a clean architecture pattern with dependency injection, decorators, and comprehensive middleware setup.

## Development Commands

### Backend (./backend/)
```bash
# Development server with hot reload
npm run dev

# Build for production (SWC compiler)
npm run build

# Build with TypeScript compiler (alternative)
npm run build:tsc

# Run tests
npm run test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Production deployment
npm run deploy:prod
npm run deploy:dev
```

### Frontend (./frontend/)
```bash
# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Backend Structure
Built on TypeScript Express Starter with decorator-based architecture:

- **Controllers**: Handle HTTP requests with decorators (`@Controller`, `@Get`, etc.)
- **Services**: Business logic layer with dependency injection (`@Service`)
- **DTOs**: Data Transfer Objects with class-validator decorators for validation
- **Middlewares**: Express middlewares including auth, validation, and error handling
- **Models**: Mongoose models for MongoDB integration
- **Interfaces**: TypeScript interfaces for type safety
- **Utils**: Logger (Winston), environment validation, and utilities

Key architectural patterns:
- Dependency injection with `typedi` container
- Class-based controllers with reflect-metadata
- Centralized error handling with custom exceptions
- Path aliases configured in tsconfig.json (`@controllers/*`, `@services/*`, etc.)

### Frontend Structure
Modern React application with:
- **Vite**: Build tool with React SWC plugin for fast development
- **Tailwind CSS**: Utility-first styling with Vite plugin
- **TypeScript**: Strict type checking with separate configs for app and node

Expected architecture (as per project_structure.md):
- **Components**: UI components organized by feature (auth, session, video)
- **Pages**: Route-level components
- **Hooks**: Custom React hooks for state and side effects
- **Store**: State management (likely Zustand or Context)
- **Types**: TypeScript definitions
- **Lib**: API services and utilities

## Testing

Backend uses Jest with ts-jest preset:
- Test files should be in `src/` directory
- Configuration supports path mapping from tsconfig.json
- Run individual tests: `npm test -- --testNamePattern="specific test"`

## Key Configuration Files

### Backend
- **tsconfig.json**: Path aliases for clean imports (`@controllers/*`, `@services/*`)
- **jest.config.js**: Jest configuration with path mapping
- **.swcrc**: SWC compiler configuration for fast builds
- **nodemon.json**: Development server configuration
- **ecosystem.config.js**: PM2 process management

### Frontend  
- **vite.config.ts**: Vite configuration with React SWC and Tailwind plugins
- **tsconfig.json**: TypeScript configuration for the application
- **tsconfig.node.json**: TypeScript configuration for Vite config files

## Environment Setup

Backend requires environment variables (see .env files in backend/):
- Development: `.env.development.local`
- Production: `.env.production.local`  
- Test: `.env.test.local`

The backend uses `envalid` for type-safe environment variable validation.

## Database

Backend uses MongoDB with Mongoose ODM. Database connection is handled in `src/database/index.ts` with automatic connection on app startup.

## Video Recording with LiveKit Egress

The platform uses LiveKit Egress for server-side video recording, which provides reliable, high-quality recordings of video sessions.

### How It Works

1. **Server-side Recording**: Uses LiveKit's Egress service instead of client-side recording
2. **Room Composite**: Records all participants in a single composite video file
3. **Cloud Storage**: Supports AWS S3, Google Cloud Storage, and Azure Blob Storage
4. **High Quality**: Records in H264 720p at 30fps by default

### Environment Variables

Configure these environment variables for Azure Blob Storage (already configured in your project):

```bash
# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=your-azure-connection-string
AZURE_STORAGE_CONTAINER_NAME=session-recordings
```

### API Endpoints

- `POST /livekit/recording/:sessionId/start` - Start recording
- `POST /livekit/recording/stop` - Stop recording  
- `GET /livekit/recording/:egressId/status` - Get recording status

### Usage

Only educators can start/stop recordings. The recording automatically captures:
- All video streams from participants
- All audio streams mixed together
- Screen sharing content
- Composite layout based on participant count

### Storage Options

1. **Azure Blob Storage** (configured): Your project is set up to use Azure Blob Storage
2. **Local Storage** (fallback): Files saved to server disk if Azure is not configured

### File Format

Recordings are saved as MP4 files with:
- Video: H264 codec, 720p resolution, 30fps
- Audio: AAC codec with mixed audio from all participants
- Filename format: `session-{sessionId}-{timestamp}.mp4`

## Development Workflow

1. Backend server runs on default port (check NODE_ENV and PORT in config)
2. Frontend dev server runs on port 3000 (Vite default)
3. API routes should be prefixed with `/api` for proper separation
4. The project structure suggests WebRTC implementation for video calling functionality

## Swagger Documentation

Backend includes Swagger UI documentation available at `/api-docs` endpoint when running the server.


# Professional AI Coding Ruleset

## 1. Coding Philosophy

- Always produce **clean, readable, and maintainable** code.
- Prioritize **clarity** over cleverness.
- Apply **KISS (Keep It Simple, Stupid)** and **DRY (Don’t Repeat Yourself)** principles.
- Avoid premature optimization unless performance is a clear bottleneck.

## 2. Programming Paradigm

- Follow **OOP principles**:
  - Encapsulation
  - Abstraction
  - Inheritance (only when it provides clear benefit)
  - Polymorphism
- Apply **SOLID principles**:
  1. Single Responsibility Principle
  2. Open/Closed Principle
  3. Liskov Substitution Principle
  4. Interface Segregation Principle
  5. Dependency Inversion Principle
- Use **composition over inheritance** unless inheritance is the better fit.

## 3. Design Patterns

- Identify and apply **appropriate design patterns** (Factory, Singleton, Observer, Strategy, Adapter, etc.).
- Avoid overengineering — only use a pattern if it solves a real problem.
- Follow **separation of concerns** by dividing logic into well-defined modules, classes, or services.

## 4. Code Style & Structure

- Use **meaningful and consistent names** for variables, functions, classes, and files.
- Keep functions and methods short (ideally ≤ 20 lines).
- Ensure a logical file/folder structure that reflects system architecture.
- Use consistent indentation (spaces over tabs unless project specifies otherwise).
- Follow standard language-specific style guides (PEP 8 for Python, Airbnb for JavaScript, etc.).

## 5. Documentation & Comments

- Add **docstrings** to all public classes, methods, and modules.
- Use inline comments **only for non-obvious logic** — don’t state the obvious.
- Keep comments up-to-date with code changes.
- Provide high-level documentation for system architecture when relevant.

## 6. Error Handling & Logging

- Always handle errors gracefully; avoid silent failures.
- Use exceptions for exceptional conditions, not control flow.
- Log important operations and errors with appropriate severity levels.

## 7. Testing

- Provide **unit tests** for all core logic.
- Write tests before or alongside code (TDD preferred when possible).
- Ensure high coverage for business-critical code.
- Use descriptive test names and keep tests isolated.

## 8. Security & Performance

- Validate and sanitize all external inputs.
- Avoid hardcoding sensitive data; use environment variables.
- Be mindful of performance in loops, queries, and network calls.
- Optimize only when necessary, but ensure scalability in design.

## 9. Self-Review Before Output

- After generating code, review it against these rules.
- If any rule is violated, **revise the code** before final output.
- Provide a short explanation of how the final solution follows these rules.

## 10. Delivery Format

- Provide complete, runnable code unless otherwise instructed.
- Include instructions for running or integrating the code.
- Keep output language-specific but adaptable if needed.

---

When producing code, you MUST:

1. Follow all rules above.
2. Suggest improvements if applicable.
