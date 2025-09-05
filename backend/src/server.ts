import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { UserRoute } from '@routes/users.route';
import { SessionsRoute } from '@routes/sessions.route';
import { LiveKitRoute } from '@routes/livekit.route';
import { ChatMessageRoute } from '@routes/chatMessages.route';
import { ValidateEnv } from '@utils/validateEnv';
import { logger } from '@utils/logger';

ValidateEnv();

// Async initialization with proper error handling
(async () => {
  try {
    logger.info('🚀 Starting application...');

    // Initialize app instance
    const app = new App([
      new AuthRoute(), 
      new UserRoute(), 
      new SessionsRoute(), 
      new LiveKitRoute(), 
      new ChatMessageRoute()
    ]);

    // Connect to database before starting server
    await app.connectToDatabase();
    
    // Start the server
    app.listen();
    
    logger.info('✅ Application started successfully');
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
})();