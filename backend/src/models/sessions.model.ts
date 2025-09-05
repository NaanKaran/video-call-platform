import { Session } from '@interfaces/sessions.interface';
import ModelContext from '@/database/ModelContext';
import { Document, Model } from 'mongoose';

export const getSessionModel = async (): Promise<Model<Session & Document>> => {
  const modelContext = ModelContext.getInstance();
  return modelContext.getSessionModel();
};