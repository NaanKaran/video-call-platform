import api from '../config/api';
import type { User, ApiResponse } from '../types';

class UserService {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  }

  // Get multiple users by their IDs
  async getUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    
    // Since there's no bulk endpoint, we'll fetch users individually
    const userPromises = ids.map(id => this.getUserById(id));
    const users = await Promise.allSettled(userPromises);
    
    return users
      .filter((result): result is PromiseFulfilledResult<User> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  // Create a user mapping by identity/email for quick lookups
  async createUserMap(): Promise<Map<string, User>> {
    const users = await this.getAllUsers();
    const userMap = new Map<string, User>();
    
    users.forEach(user => {
      userMap.set(user._id, user);
      userMap.set(user.email, user);
    });
    
    return userMap;
  }
}

export default new UserService();