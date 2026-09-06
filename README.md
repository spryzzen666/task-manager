# Task Manager — планировщик задач с аккаунтами

Полноценное full-stack SPA: регистрация и вход, сессии, создание/редактирование/удаление задач, фильтры. Фронтенд на **React + TypeScript (Vite)**, бэкенд на **Node.js (Express)**, данные в **SQLite**.

**Живое демо:** https://task-manager-u5qh.onrender.com
*(бесплатный тариф Render — при первом открытии сервис «просыпается» несколько секунд)*

**Стек:** React 18, TypeScript, Vite, Node.js, Express, SQLite (встроенный `node:sqlite`), без внешних зависимостей для паролей (scrypt из `node:crypto`).

## Возможности

- Регистрация и вход (пароль хэшируется scrypt + соль, поблочное сравнение — защита от timing-атак)
- Сессии на токенах: авторизация через `Bearer`-токен, восстановление сессии при перезагрузке страницы
- CRUD задач: создать, добавить, переименовать (двойной клик), удалить, отметить выполненной
- Фильтры: Все / Активные / Выполненные (сервер всегда отдаёт сначала невыполненные)
- Счётчик оставшихся задач
- Состояния интерфейса: загрузка, пустой список, ошибки API
- Адаптивная вёрстка, тёмная тема

## Деплой (один сервис на Render.com)

Проект спроектирован так, что **собранный React-клиент отдаётся прямо самим Express-сервером** — фронт и API живут на одном домене, деплой сводится к одному Web Service.

1. Залей репозиторий на GitHub
2. Render → **New → Web Service** → подключи GitHub-репозиторий `task-manager`
3. **Root Directory:** `server`
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. Create Web Service

Порядок сборки: клиент собирается командой `npm run build` (`client/`), `dist/` копируется в `server/public/`, а Express отдаёт его через `express.static` + SPA-фоллбэк. Render ставит `PORT` сам — сервер уже читает `process.env.PORT`.

> На бесплатном тарифе ненагруженный сервис засыпает через ~15 минут и просыпается при первом запросе — первые секунды загрузки могут быть медленными. База данных живёт в файле `server/src/taskmanager.db`, который на Render сбрасывается при редеплое (ок для учебного проекта).

## Запуск (локально)

Нужен Node.js **22.5+** (для встроенного `node:sqlite`).

**Вариант A — быстрый (как в проде): собрать клиент в сервер**

```bash
cd client && npm install && npm run build   # соберёт client/dist
cd ../server && npm install && npm run dev  # → http://localhost:4000
```

Открой http://localhost:4000 — сервер отдаст и фронт, и API.

**Вариант B — разработка (Vite-proxy):**

Терминал 1 — сервер:
```bash
cd server
npm install
npm run dev        # → http://localhost:4000
```

Терминал 2 — фронтенд:
```bash
cd client
npm install
npm run dev        # → http://localhost:5173
```

Открой http://localhost:5173. Vite проксирует `/api` на сервер, CORS на фронтенде не нужен.

База данных создаётся автоматически: `server/src/taskmanager.db`. Для сброса просто удали её.

## Структура проекта

```
task-manager/
├── client/                    # React + TypeScript (Vite)
│   ├── index.html
│   ├── vite.config.ts         # прокси /api → :4000 (в dev)
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx           # точка входа
│       ├── App.tsx            # состояние приложения, сессия
│       ├── types.ts           # общие типы (Task, User, Filter)
│       ├── vite-env.d.ts      # типы Vite-переменных окружения
│       ├── styles.css
│       ├── api/
│       │   └── client.ts      # fetch-обёртка над REST API
│       └── components/
│           ├── AuthView.tsx   # вход / регистрация
│           ├── TaskBoard.tsx  # создание, фильтры, список
│           └── TaskItem.tsx   # строка задачи (режим редактирования)
├── server/                    # Node.js + Express + SQLite
│   ├── package.json
│   ├── public/                # собранный клиент, отдаётся статикой (генерируется)
│   └── src/
│       ├── index.js           # REST API + раздача статики (express.static + SPA-фоллбэк)
│       ├── db.js              # подключение SQLite, миграции
│       └── auth.js            # scrypt-хэш, генерация токенов
├── docs/                      # скриншоты
├── vercel.json                # (неактуально — деплой идёт через Render)
└── .gitignore
```

## API

| Метод | Путь | Назначение |
|-------|------|-----------|
| POST | `/api/auth/register` | Регистрация (`name`, `email`, `password`) → `{token, user}` |
| POST | `/api/auth/login` | Вход (`email`, `password`) → `{token, user}` |
| GET | `/api/auth/me` | Текущий пользователь (защищён) |
| POST | `/api/auth/logout` | Завершение сессии |
| GET | `/api/tasks` | Задачи пользователя (защищён) |
| POST | `/api/tasks` | Создать задачу (`title`) |
| PUT | `/api/tasks/:id` | Обновить (`title`, `done`) |
| DELETE | `/api/tasks/:id` | Удалить |

Защищённые маршруты требуют заголовок `Authorization: Bearer <token>`.

## Ключевые решения

- **Фронт + бэк на одном сервере** — Express отдаёт собранный React через `express.static` + SPA-фоллбэк: один домен, один деплой, ноль проблем с CORS
- **`node:sqlite` вместо ORM** — ноль лишних зависимостей, чистый SQL в prepared statements (защита от SQL-инъекций)
- **scrypt из `node:crypto`** — соль на каждый пароль, `timingSafeEqual` против timing-атак
- **Сессии на токенах в таблице `sessions`** — вместо JWT проще для понимания и можно отозвать
- **`strict` TypeScript** на фронте — типизация всех API-ответов через `api/client.ts`
- Одинаковая свёртка ответов: списки, доступность записей только владельцу (`WHERE user_id = ?`)

## Кастомизация

- Цвета — CSS-переменные в `client/src/styles.css`
- Порт сервера — `PORT` (по умолч. 4000)
- Валидации — длина пароля в `server/src/index.js`
- Адрес API в dev — см. `VITE_API_URL` в `client/src/api/client.ts` (локально не нужен: Vite проксирует `/api`)

Создатель: Asankhan Dauletov