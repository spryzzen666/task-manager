import { useState } from 'react';
import type { Task } from '../types';

interface Props {
  task: Task;
  onToggle: (id: number) => Promise<void>;
  onRename: (id: number, title: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TaskItem({ task, onToggle, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [error, setError] = useState('');

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    const next = draft.trim();
    if (!next) {
      setError('Заголовок не может быть пустым');
      return;
    }
    try {
      if (next !== task.title) await onRename(task.id, next);
      setEditing(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    }
  }

  function cancel() {
    setDraft(task.title);
    setEditing(false);
    setError('');
  }

  if (editing) {
    return (
      <li className={`task-item ${task.done ? 'task-done' : ''}`}>
        <form className="task-edit-form" onSubmit={save}>
          <input
            className="create-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          {error && <span className="form-error">{error}</span>}
          <div className="task-actions">
            <button className="btn btn-small btn-primary" type="submit">
              Сохранить
            </button>
            <button className="btn btn-small btn-ghost" type="button" onClick={cancel}>
              Отмена
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`task-item ${task.done ? 'task-done' : ''}`}>
      <button
        className={`task-check ${task.done ? 'task-check-done' : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? 'Отметить как невыполненную' : 'Отметить как выполненную'}
      >
        {task.done ? '✓' : ''}
      </button>
      <span className="task-title" onDoubleClick={() => setEditing(true)}>
        {task.title}
      </span>
      <div className="task-actions">
        <button className="btn btn-small btn-ghost" onClick={() => setEditing(true)}>
          Изменить
        </button>
        <button className="btn btn-small btn-danger" onClick={() => onDelete(task.id)}>
          Удалить
        </button>
      </div>
    </li>
  );
}