import { User } from '../types';
import fetchApi from './api';

export const loginUser = async (credentials: { email?: string, phone?: string, password?: string }): Promise<{ token: string, user: User }> => {
  return fetchApi<{ token: string, user: User }>('/auth/login', {
    method: 'POST',
    body: credentials,
  });
};

export const registerUser = async (userData: Omit<User, 'id' | 'role' | 'accountStatus'> & { password?: string }): Promise<User> => {
  return fetchApi<User>('/auth/register', {
    method: 'POST',
    body: userData,
  });
};

export const getUsers = async (): Promise<User[]> => {
  return fetchApi<User[]>('/users');
};

export const getUserById = async (userId: string): Promise<User | undefined> => {
  return fetchApi<User | undefined>(`/users/${userId}`);
};

export const updateUser = async (userId: string, updates: Partial<Omit<User, 'id' | 'role' | 'accountStatus'>>): Promise<User | undefined> => {
  return fetchApi<User | undefined>(`/users/${userId}`, {
    method: 'PUT',
    body: updates,
  });
};

export const updateUserAccountStatus = async (userId: string, newStatus: User['accountStatus']): Promise<User | undefined> => {
  return fetchApi<User | undefined>(`/users/${userId}/status`, {
    method: 'PATCH',
    body: { accountStatus: newStatus },
  });
};
