# API для управления пользователями

## Аутентификация

### POST /meme/api/auth/login

Вход в систему с отслеживанием устройства. Клиент ДОЛЖЕН передавать стабильный `deviceId` (например, сохраненный в localStorage). Если не передан, сервер использует fallback по User-Agent.

**Тело запроса:**

```json
{
    "username": "admin",
    "password": "admin123",
    "deviceId": "stable-client-device-id"
}
```

**Ответ:**

```json
{
    "token": "jwt_token_here",
    "user": {
        "id": 1,
        "username": "admin",
        "role": "admin"
    },
    "deviceId": "unique_device_id"
}
```

### GET /meme/api/auth/me

Получить информацию о текущем пользователе.

**Заголовки:**

```
Authorization: Bearer <token>
```

**Ответ:**

```json
{
    "user": {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "is_blocked": false,
        "created_at": "2024-01-01T00:00:00.000Z",
        "last_login": "2024-01-01T12:00:00.000Z"
    },
    "deviceId": "unique_device_id"
}
```

### GET /meme/api/auth/my-sessions

Получить активные сессии текущего пользователя.

**Заголовки:**

```
Authorization: Bearer <token>
```

**Ответ:**

```json
{
    "sessions": [
        {
            "id": 1,
            "device_id": "unique_device_id",
            "device_info": "Mozilla/5.0...",
            "ip_address": "127.0.0.1",
            "user_agent": "Mozilla/5.0...",
            "created_at": "2024-01-01T00:00:00.000Z",
            "last_activity": "2024-01-01T12:00:00.000Z",
            "is_active": 1
        }
    ]
}
```

### POST /meme/api/auth/logout

Завершить текущую сессию.

**Заголовки:**

```
Authorization: Bearer <token>
```

**Ответ:**

```json
{
    "message": "Сессия успешно завершена",
    "changes": 1
}
```

## Управление пользователями (только для администраторов)

### GET /meme/api/users

Получить список всех пользователей с пагинацией и фильтрацией.

**Заголовки:**

```
Authorization: Bearer <admin_token>
```

**Параметры запроса:**

- `page` (опционально) - номер страницы (по умолчанию 1)
- `limit` (опционально) - количество пользователей на странице (по умолчанию 10)
- `search` (опционально) - поиск по имени пользователя
- `role` (опционально) - фильтр по роли (admin, writer, user)
- `blocked` (опционально) - фильтр по статусу блокировки (true/false)

**Пример запроса:**

```
GET /meme/api/users?page=1&limit=10&search=admin&role=admin&blocked=false
```

**Ответ:**

```json
{
    "users": [
        {
            "id": 1,
            "username": "admin",
            "role": "admin",
            "is_blocked": 0,
            "created_at": "2024-01-01T00:00:00.000Z",
            "last_login": "2024-01-01T12:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "pages": 1
    }
}
```

### GET /meme/api/users/:id

Получить информацию о конкретном пользователе.

**Заголовки:**

```
Authorization: Bearer <admin_token>
```

**Ответ:**

```json
{
    "id": 1,
    "username": "admin",
    "role": "admin",
    "is_blocked": 0,
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-01-01T12:00:00.000Z"
}
```

### POST /meme/api/users

Создать нового пользователя.

**Заголовки:**

```
Authorization: Bearer <admin_token>
```

**Тело запроса:**

```json
{
    "username": "newuser",
    "password": "password123",
    "role": "user"
}
```

**Ответ:**

```json
{
    "message": "Пользователь успешно создан",
    "user": {
        "id": 2,
        "username": "newuser",
        "role": "user"
    }
}
```

### PUT /meme/api/users/:id

Обновить информацию о пользователе.

**Заголовки:**

```
Authorization: Bearer <admin_token>
```

**Тело запроса (все поля опциональны):**

```json
{
    "username": "newusername",
    "password": "newpassword123",
    "role": "writer",
    "is_blocked": false
}
```

**Ответ:**

```json
{
    "message": "Пользователь успешно обновлен",
    "changes": 1
}
```

### DELETE /meme/api/users/:id

Удалить пользователя.

**Заголовки:**

```
Authorization: Bearer <admin_token>
```

**Ответ:**

```json
{
    "message": "Пользователь успешно удален",
    "changes": 1
}
```

### PATCH /meme/api/users/:id/block

Заблокировать или разблокировать пользователя.

**Заголовки:**

```
Authorization: Bearer <admin_token>
```

**Тело запроса:**

```json
{
    "is_blocked": true
}
```

**Ответ:**

```json
{
    "message": "Пользователь заблокирован",
    "changes": 1
}
```

### GET /meme/api/users/:id/sessions

Получить активные сессии конкретного пользователя.

**Заголовки:**

```
Authorization: Bearer <admin_token>
```

**Ответ:**

```json
{
    "sessions": [
        {
            "id": 1,
            "device_id": "unique_device_id",
            "device_info": "Mozilla/5.0...",
            "ip_address": "127.0.0.1",
            "user_agent": "Mozilla/5.0...",
            "created_at": "2024-01-01T00:00:00.000Z",
            "last_activity": "2024-01-01T12:00:00.000Z",
            "is_active": 1
        }
    ]
}
```

### DELETE /meme/api/users/:id/sessions/:sessionId

Завершить конкретную сессию пользователя.

**Заголовки:**

```
Authorization: Bearer <admin_token>
```

**Ответ:**

```json
{
    "message": "Сессия успешно завершена",
    "changes": 1
}
```

## Коды ошибок

- `400` - Неверные данные запроса
- `401` - Не авторизован
- `403` - Недостаточно прав доступа / Аккаунт заблокирован
- `404` - Пользователь/сессия не найдена
- `500` - Ошибка сервера

## Особенности

1. **Отслеживание устройств**: При каждом входе в систему генерируется уникальный `device_id` на основе User-Agent, IP-адреса и языка браузера.

2. **Блокировка пользователей**: Заблокированные пользователи не могут войти в систему.

3. **Безопасность**: Администраторы не могут удалить или заблокировать самих себя.

4. **Сессии**: Система отслеживает все активные сессии пользователей с информацией об устройстве и IP-адресе.

5. **Пагинация**: Список пользователей поддерживает пагинацию и фильтрацию.
