# Настройка системы ролей и прав доступа

## Обзор изменений

Добавлена система ролей пользователей и прав доступа к мемам:

### Роли пользователей:
- **admin** - полные права (создание, чтение, редактирование, удаление всех мемов, создание пользователей)
- **writer** - полные права на мемы (создание, чтение, редактирование, удаление всех мемов)
- **user** - права только на чтение (может видеть только публичные мемы)

### Права доступа к мемам:
- **public** - доступны всем аутентифицированным пользователям
- **private** - доступны только администраторам

## Установка и настройка

### 1. Запуск миграции базы данных
```bash
npm run migrate
```

### 3. Запуск сервера
```bash
npm run dev
```

## API Endpoints

### Аутентификация

#### POST /meme/api/auth/login
Вход в систему
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Ответ:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### Мемы

Все запросы к мемам требуют аутентификации (заголовок `Authorization: Bearer <token>`).

#### GET /meme/api/memes
Получение списка мемов
- Пользователи видят: только public мемы
- Администраторы видят: все мемы

#### GET /meme/api/memes/:id
Получение конкретного мема
- Проверяются права доступа согласно permissions мема

#### POST /meme/api/memes
Создание нового мема (только для администраторов)
```json
{
  "tags": "[\"tag1\", \"tag2\"]",
  "description": "Описание мема",
  "permissions": "public"  // "public", "private"
}
```

#### PUT /meme/api/memes/:id
Редактирование мема (только для администраторов)

#### DELETE /meme/api/memes/:id
Удаление мема (только для администраторов)

## Переменные окружения

Добавьте в `.env` файл:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your_secret_key_here
```

## Структура базы данных

### Таблица users
- id (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE NOT NULL)
- password_hash (TEXT NOT NULL)
- role (TEXT NOT NULL DEFAULT 'user')
- created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)

### Таблица memes
- id (INTEGER PRIMARY KEY)
- fileName (TEXT NOT NULL)
- tags (TEXT)
- description (TEXT)
- permissions (TEXT DEFAULT 'private')
