import { useState } from 'react';
import { api, setToken } from '../api/client';
import type { User } from '../types';

interface Props {
  onAuth: (user: User) => void;
}

export default function AuthView({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(name, email, password);
      setToken(res.token);
      onAuth(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand brand-center">
          <span className="brand-mark">▣</span>
          <h1>Task Manager</h1>
        </div>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Вход в аккаунт' : 'Создание нового аккаунта'}
        </p>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label className="field">
              <span>Имя</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как вас зовут?"
                required
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="field">
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Минимум 6 символов' : '••••••••'}
              minLength={6}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <button className="btn btn-ghost" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
}