import { useState } from 'react';
import type { Task, Filter } from '../types';
import TaskItem from './TaskItem';

interface Props {
  tasks: Task[];
  filter: Filter;
  onFilter: (f: Filter) => void;
  onCreate: (title: string) => Promise<void>;
  onToggle: (id: number) => Promise<void>;
  onRename: (id: number, title: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'done', label: 'Выполненные' },
];

export default function TaskBoard({
  tasks,
  filter,
  onFilter,
  onCreate,
  onToggle,
  onRename,
  onDelete,
}: Props) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const visible = tasks.filter((t) => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  const remaining = tasks.filter((t) => !t.done).length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await onCreate(title);
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="board">
      <section className="create-card">
        <form className="create-form" onSubmit={submit}>
          <input
            className="create-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Новая задача…"
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={busy || !title.trim()}>
            Добавить
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
      </section>

      <section className="toolbar">
        <div className="tabs">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              className={`tab ${filter === key ? 'tab-active' : ''}`}
              onClick={() => onFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="counter">
          Осталось: <strong>{remaining}</strong>
        </span>
      </section>

      <section className="task-list" aria-live="polite">
        {visible.length === 0 ? (
          <p className="empty-state">
            {tasks.length === 0
              ? 'Задач пока нет. Добавьте первую!'
              : 'В этой категории пока пусто.'}
          </p>
        ) : (
          visible.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))
        )}
      </section>
    </main>
  );
}