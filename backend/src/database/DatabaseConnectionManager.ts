import mongoose, { Connection } from 'mongoose';
import { MONGO_URI } from '@config';
import { logger } from '@utils/logger';

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  
  public primaryDbConnection!: Connection;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  public static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    try {
      if (!this.primaryDbConnection) {
        logger.info('🔗 Connecting to primary database...');
        this.primaryDbConnection = await mongoose.createConnection(MONGO_URI).asPromise();
        logger.info('✅ Connected to primary database');
      }

      this.isConnected = true;
    } catch (error) {
      logger.error('❌ Error connecting to database:', error);
      this.connectionPromise = null;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.primaryDbConnection) {
      await this.primaryDbConnection.close();
      this.isConnected = false;
      this.connectionPromise = null;
      logger.info('🔌 Disconnected from database');
    }
  }

  public isConnectionReady(): boolean {
    return this.isConnected && this.primaryDbConnection?.readyState === 1;
  }
}