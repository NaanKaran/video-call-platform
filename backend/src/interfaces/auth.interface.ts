import { Request } from 'express';
import { User } from '@interfaces/users.interface';

export interface DataStoredInToken {
  id: string;
  email: string;
  role: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: 'educator' | 'child';
  };
}
