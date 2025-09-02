import { Document } from 'mongoose';

export interface User extends Document {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: 'educator' | 'child';
  createdAt?: Date;
  updatedAt?: Date;
}
