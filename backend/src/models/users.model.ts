import { User } from '@interfaces/users.interface';
import ModelContext from '@/database/ModelContext';
import { Document, Model } from 'mongoose';

export const getUserModel = async (): Promise<Model<User & Document>> => {
  const modelContext = ModelContext.getInstance();
  return modelContext.getUserModel();
};
