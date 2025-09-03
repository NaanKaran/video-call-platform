import { connect, set } from 'mongoose';
import { NODE_ENV, MONGO_URI, DB_DATABASE } from '@config';

export const dbConnection = async () => {
  const dbConfig = {
    url: MONGO_URI
  };

  
    set('debug', true);
  

  await connect(dbConfig.url);
}
