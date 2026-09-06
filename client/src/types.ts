export interface Task {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type Filter = 'all' | 'active' | 'done';