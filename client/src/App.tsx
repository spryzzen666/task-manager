import { useEffect, useState } from 'react';
import { api, getToken, clearToken } from './api/client';
import type { User, Task, Filter } from './types';
import AuthView from './components/AuthView';
import TaskBoard from './components/TaskBoard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  // Восстановление сессии при перезагрузке страницы
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(({ user }) => {
        setUser(user);
        return api.listTasks();
      })
      .then(setTasks)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAuth(user: User) {
    setUser(user);
    setTasks(await api.listTasks());
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      /* игнорируем ошибки сети при выходе */
    }
    clearToken();
    setUser(null);
    setTasks([]);
  }

  async function handleCreate(title: string) {
    const task = await api.createTask(title);
    setTasks((prev) => [task, ...prev]);
  }

  async function handleToggle(id: number) {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const updated = await api.updateTask(id, { done: !target.done });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleRename(id: number, title: string) {
    const updated = await api.updateTask(id, { title });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDelete(id: number) {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return <div className="page-loading">Загрузка…</div>;
  }

  return (
    <div className="app">
      {user ? (
        <>
          <header className="app-header">
            <div className="brand">
              <span className="brand-mark">▣</span>
              <h1>Task Manager</h1>
            </div>
            <div className="user-box">
              <span className="user-name">{user.name}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          </header>
          <TaskBoard
            tasks={tasks}
            filter={filter}
            onFilter={setFilter}
            onCreate={handleCreate}
            onToggle={handleToggle}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <AuthView onAuth={handleAuth} />
      )}
    </div>
  );
}