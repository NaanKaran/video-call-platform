# Environment Variables Setup

This project uses environment variables to configure backend URLs and external service endpoints. This allows for different configurations between development, staging, and production environments.

## Environment Files

- `.env` - Base configuration (committed to git)
- `.env.development` - Development-specific overrides
- `.env.production` - Production-specific overrides
- `.env.local` - Local overrides (not committed to git)
- `.env.example` - Template file showing required variables

## Required Variables

All environment variables must be prefixed with `VITE_` to be accessible in the browser:

```bash
# Backend API configuration
VITE_API_BASE_URL=https://your-backend-url.com/api
VITE_SOCKET_BASE_URL=https://your-backend-url.com

# LiveKit configuration  
VITE_LIVEKIT_URL=wss://your-livekit-server.com
```

## Environment Loading Priority

Vite loads environment files in this order (higher priority overrides lower):

1. `.env.local` (highest priority, not committed)
2. `.env.[mode].local` (development/production specific, not committed)
3. `.env.[mode]` (development/production specific)
4. `.env` (base configuration)

## Usage in Code

Access environment variables through `import.meta.env`:

```typescript
// In src/config/environment.ts
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'fallback-url',
  // ...other config
} as const;
```

## Security Note

⚠️ **Important**: All `VITE_*` variables are embedded in the client-side bundle and are publicly accessible. Never put sensitive secrets (API keys, passwords) in these variables.

## Local Development Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your local development values
3. The `.env.local` file will not be committed to git

## TypeScript Support

Environment variables are type-safe through the `ImportMetaEnv` interface in `src/vite-env.d.ts`.