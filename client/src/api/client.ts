import type { Task, AuthResponse, User } from '../types';

const TOKEN_KEY = 'tm_token';

// На проде адрес API задаётся переменной VITE_API_URL на Vercel,
// локально Vite проксирует /api на Express (см. vite.config.ts)
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (body as { error?: string }).error || `Ошибка ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  register(name: string, email: string, password: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  me() {
    return request<{ user: User }>('/auth/me');
  },

  logout() {
    return request<{ ok: boolean }>('/auth/logout', { method: 'POST' });
  },

  listTasks() {
    return request<Task[]>('/tasks');
  },

  createTask(title: string) {
    return request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  updateTask(id: number, patch: Partial<Pick<Task, 'title' | 'done'>>) {
    return request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  },

  deleteTask(id: number) {
    return request<{ ok: boolean }>(`/tasks/${id}`, { method: 'DELETE' });
  },
};