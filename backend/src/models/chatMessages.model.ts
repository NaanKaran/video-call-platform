import ModelContext, { ChatMessage } from '@/database/ModelContext';
import { Document, Model } from 'mongoose';

export const getChatMessageModel = async (): Promise<Model<ChatMessage & Document>> => {
  const modelContext = ModelContext.getInstance();
  return modelContext.getChatMessageModel();
};

export { ChatMessage };