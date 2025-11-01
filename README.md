# Meme Navigator

Короткое описание
Проект "Meme Navigator" — галерея мемов с офлайн-поддержкой, ролями пользователей, WebPush и RSS. Состоит из двух частей: бэкенд на TypeScript/Express и фронтенд на React.

### Сайт развернут на домене: [meme.gagikpog.ru](https://meme.gagikpog.ru)
---

## Структура репозитория (ключевые файлы)
- Backend: [backend/src/server.ts](backend/src/server.ts) — точка входа сервера.
- Backend конфигурация: [backend/package.json](backend/package.json) (скрипты: `dev`, `build`, `start`) и [backend/tsconfig.json](backend/tsconfig.json).
- База данных и миграции: [backend/src/db/database.ts](backend/src/db/database.ts) и каталог миграций [backend/src/migrations/009_update_files_date.ts](backend/src/migrations/009_update_files_date.ts).
- Роуты и авторизация: [backend/src/routes/memes.ts](backend/src/routes/memes.ts), [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts).
- Типы и модели: [`TRules`](backend/src/types/index.ts) в [backend/src/types/index.ts](backend/src/types/index.ts).
- Роли и настройка: [backend/ROLES_SETUP.md](backend/ROLES_SETUP.md).
- Frontend: [front/package.json](front/package.json) (скрипты: `dev`, `build`), точка входа [front/src/index.js](front/src/index.js).
- Frontend конфигурации: [front/src/config.js](front/src/config.js).
- PWA и сервис-воркер: [front/public/service-worker.js](front/public/service-worker.js), [front/public/.webmanifest](front/public/.webmanifest), [front/public/robots.txt](front/public/robots.txt).
- Важные страницы: [front/src/pages/Home.js](front/src/pages/Home.js), [front/src/pages/MemeDetail.js](front/src/pages/MemeDetail.js), [front/src/pages/Timeline.js](front/src/pages/Timeline.js), [front/src/pages/Users.js](front/src/pages/Users.js).
- Утилиты загрузки/просмотра: [front/src/components/UploadForm.js](front/src/components/UploadForm.js).

---

## Быстрый старт (локально)

1. Запустить сервер (backend)
   - Перейти в папку backend и установить зависимости:
     ```sh
     cd backend
     npm install
     ```
   - Запустить в режиме разработки:
     ```sh
     npm run dev
     ```
   - Сервер конфигурируется через `.env` (см. backend/ROLES_SETUP.md).

2. Запустить фронтенд
   - Перейти в папку front, установить зависимости и запустить:
     ```sh
     cd front
     npm install
     npm run dev
     ```
   - Конфигурация API и адресов в config.js.

3. База данных
   - SQLite файл: memes.db (создаётся/инициализируется скриптами и миграциями в backend/src/migrations).
   - Включены миграции для структуры и данных (пример: [009_update_files_date.ts](backend/src/migrations/009_update_files_date.ts), backend/src/migrations/011_update_memes_authors.ts).

---

## Функциональность

- Роли пользователей: доку [ROLES_SETUP.md](backend/ROLES_SETUP.md).
- Мемы: загрузка, теги, описание, права доступа (public / private / moderate) — реализовано в [memes.ts](backend/src/routes/memes.ts).
- Авторизация и сессии: middleware в [auth.ts](backend/src/routes/auth.ts).
- PWA: офлайн-кеширование и события push в [service-worker.js](front/public/service-worker.js) и манифест в [.webmanifest](front/public/.webmanifest).
- RSS: маршрут для публичных мемов реализован в бэкенде (см. backend/src/routes/rss.ts).

---

## Разработка и тесты

- TypeScript компиляция для бэкенда: `npm run build` в папке backend.
- В режиме разработки бэкенд работает через `ts-node`/`nodemon` (`npm run dev`).
- Фронтенд использует Create React App (`npm run dev` / `npm run build` в папке front).

---

## Полезные заметки и TODO
- Планируемые фичи и идеи описаны в [roadmap.md](roadmap.md) (включая систему комментариев и оценок, TODO-листы, просмотр мемов автора).
---
