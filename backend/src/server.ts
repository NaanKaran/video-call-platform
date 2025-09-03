import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { UserRoute } from '@routes/users.route';
import { SessionsRoute } from '@routes/sessions.route';
import { LiveKitRoute } from '@routes/livekit.route';

async function bootstrap() {
   console.log("🚀 Starting server...");
  try {

    const app = new App([
      new AuthRoute(),
      new UserRoute(),
      new SessionsRoute(),
      new LiveKitRoute(),
    ]);

    app.listen();
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1); // crash with explicit log
  }
}

// catch unhandled errors
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

bootstrap();