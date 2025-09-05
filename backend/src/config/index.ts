import { config } from 'dotenv';
config();
// Only load .env files locally (not in Azure)

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN } = process.env;
export const { DB_HOST, MONGO_URI, DB_DATABASE } = process.env;
export const { LIVEKIT_API_KEY, LIVEKIT_SECRET_KEY, LIVEKIT_WS_URL } = process.env;
export const { AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_CONTAINER_NAME } = process.env;
