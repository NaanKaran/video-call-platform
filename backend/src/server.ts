import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { UserRoute } from '@routes/users.route';
import { SessionsRoute } from '@routes/sessions.route';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([
  new AuthRoute(), 
  new UserRoute(), 
  new SessionsRoute()
]);

app.listen();
