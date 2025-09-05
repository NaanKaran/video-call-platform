import { cleanEnv, port, str } from 'envalid';

export const ValidateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
    MONGO_URI: str(),
    SECRET_KEY: str(),
    LIVEKIT_API_KEY: str(),
    LIVEKIT_SECRET_KEY: str(),
    LIVEKIT_WS_URL: str(),
    AZURE_STORAGE_CONNECTION_STRING: str({ default: '' }),
    AZURE_STORAGE_CONTAINER_NAME: str({ default: 'session-recordings' }),
  });
};
