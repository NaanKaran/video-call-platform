import { DatabaseConnectionManager } from './DatabaseConnectionManager';

export const dbConnection = async () => {
  const dbManager = DatabaseConnectionManager.getInstance();
  await dbManager.connect();
};

export { DatabaseConnectionManager };
