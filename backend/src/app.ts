import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { createServer, Server as HttpServer } from 'http';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS } from '@config';
import { dbConnection } from '@database';
import { Routes } from '@interfaces/routes.interface';
import { ErrorMiddleware } from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';
import { SocketHandler } from '@/socket/socket.handler';

export class App {
  public app: express.Application;
  public server: HttpServer;
  public env: string;
  public port: number;
  public socketHandler: SocketHandler;

  constructor(routes: Routes[]) {
    console.log('🚀 Initializing app...');
    this.app = express();
    this.server = createServer(this.app);
    this.env = NODE_ENV || 'development';
    this.port = Number(PORT) || 3000; // ✅ ensure number

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeSocket();
    this.initializeErrorHandling();
  }

  public listen() {
    // ✅ bind to 0.0.0.0 for Docker & WebRTC signaling
    this.server.listen(this.port, '0.0.0.0', () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on http://0.0.0.0:${this.port}`);
      logger.info(`📡 Socket.io signaling server is running`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeSocket() {
    this.socketHandler = new SocketHandler(this.server);
    logger.info('✅ Socket.IO initialized');
  }

  public async connectToDatabase() {
    logger.info('⏳ Connecting to database...');
    try {
      await dbConnection();
      logger.info('✅ Database connected');
    } catch (err) {
      logger.error('❌ Database connection failed:', err);
      throw err;
    }
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: Routes[]) {
    this.app.get('/', (req, res) => {
      res.send('✅ App is running in container');
    });

    this.app.get('/health', (req, res) => {
      res.send('OK');
    });

    this.app.get('/api', (req, res) => {
      res.send('API is working');
    });

    routes.forEach(route => {
      this.app.use('/api', route.router);
    });
  }

  private initializeSwagger() {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Video Call Platform API',
          version: '1.0.0',
          description: 'API for Video Call Platform with WebRTC signaling',
        },
        servers: [
          {
            url: `http://localhost:${this.port}/api`,
            description: 'Development server',
          },
        ],
      },
      apis: ['./swagger.yaml'],
    };

    const specs = swaggerJSDoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }
}
