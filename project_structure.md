# Video Call Platform - Project Structure

## Using Vite (Frontend) + TypeScript Express Starter (Backend)

```
video-call-platform/
│
├── frontend/                          # Vite + React + TypeScript + Tailwind
│   ├── public/
│   │   ├── vite.svg
│   │   └── index.html
│   ├── src/
│   │   ├── components/               # UI components
│   │   │   ├── ui/                   # Base UI components (shadcn-style)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── modal.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── session/
│   │   │   │   ├── CreateSession.tsx
│   │   │   │   ├── JoinSession.tsx
│   │   │   │   └── SessionList.tsx
│   │   │   └── video/
│   │   │       ├── VideoCall.tsx
│   │   │       ├── VideoControls.tsx
│   │   │       └── ParticipantGrid.tsx
│   │   ├── pages/                    # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── SessionPage.tsx
│   │   ├── lib/                      # Utilities & services
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── session.ts
│   │   │   ├── webrtc.ts
│   │   │   └── utils.ts
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useWebRTC.ts
│   │   │   └── useSocket.ts
│   │   ├── store/                    # State management (Zustand/Context)
│   │   │   ├── authStore.ts
│   │   │   └── sessionStore.ts
│   │   ├── types/                    # TypeScript definitions
│   │   │   ├── auth.ts
│   │   │   ├── session.ts
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx                  # Vite entry point
│   │   └── index.css                 # Tailwind imports
│   ├── index.html                    # Vite HTML template
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts               # Vite configuration
│   ├── tailwind.config.js           # Tailwind configuration
│   ├── postcss.config.js
│   └── .env
│
├── backend/                          # TypeScript Express Starter Structure
│   ├── src/
│   │   ├── @types/                   # Custom type definitions
│   │   │   ├── express/index.d.ts
│   │   │   └── socket.d.ts
│   │   ├── controllers/              # Route controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── session.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── index.controller.ts
│   │   ├── databases/                # Database connections
│   │   │   ├── mongodb.ts
│   │   │   └── redis.ts
│   │   ├── dtos/                     # Data Transfer Objects
│   │   │   ├── auth.dto.ts
│   │   │   ├── session.dto.ts
│   │   │   └── user.dto.ts
│   │   ├── exceptions/               # Custom exceptions
│   │   │   ├── HttpException.ts
│   │   │   └── AuthException.ts
│   │   ├── interfaces/               # TypeScript interfaces
│   │   │   ├── auth.interface.ts
│   │   │   ├── session.interface.ts
│   │   │   └── user.interface.ts
│   │   ├── middlewares/              # Express middlewares
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── models/                   # MongoDB models
│   │   │   ├── user.model.ts
│   │   │   └── session.model.ts
│   │   ├── routes/                   # Express routes
│   │   │   ├── auth.route.ts
│   │   │   ├── session.route.ts
│   │   │   └── user.route.ts
│   │   ├── services/                 # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── session.service.ts
│   │   │   └── user.service.ts
│   │   ├── socket/                   # Socket.io handlers
│   │   │   ├── socket.ts
│   │   │   ├── webrtc.handler.ts
│   │   │   └── session.handler.ts
│   │   ├── utils/                    # Utility functions
│   │   │   ├── logger.ts
│   │   │   ├── validateEnv.ts
│   │   │   └── util.ts
│   │   ├── app.ts                    # Express app setup
│   │   └── server.ts                 # Server entry point
│   ├── logs/                         # Log files (from starter)
│   ├── ecosystem.config.js           # PM2 configuration
│   ├── jest.config.js               # Jest testing config
│   ├── nodemon.json                 # Nodemon config
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── shared/                          # Shared types (optional)
│   ├── types/
│   │   ├── api.ts
│   │   └── socket.ts
│   └── constants.ts
│
├── docs/                            # Documentation
│   ├── API.md
│   └── SETUP.md
│
├── README.md
├── .gitignore
└── package.json                     # Root workspace
```

## Key Configuration Files

### Frontend (Vite + Tailwind)

**vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Backend (TypeScript Express Starter)

**Key Features from Starter:**
- **Decorators**: Class-based controllers with decorators
- **Validation**: Built-in DTO validation with class-validator
- **Testing**: Jest setup with test examples
- **Logging**: Winston logger configuration
- **Error Handling**: Centralized error handling
- **Environment**: Type-safe environment variables

## Installation Commands

### Frontend Setup
```bash
# Create Vite project
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Additional packages
npm install socket.io-client axios zustand
```

### Backend Setup
```bash
# Clone TypeScript Express Starter
npx typescript-express-starter backend
cd backend
npm install

# Additional packages for our project
npm install socket.io mongoose ioredis
npm install -D @types/mongoose
```

## Development Workflow

1. **Frontend**: `npm run dev` (Vite dev server on port 3000)
2. **Backend**: `npm run dev` (Express server on port 5000)
3. **Proxy**: Vite proxies `/api` calls to backend automatically

This structure leverages the best practices from both frameworks while maintaining clean separation and modern development patterns.