import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import formatDate from '../utils/formatDate';
import AvatarDisplay from '../components/AvatarDisplay';
import { Session, User } from '../types';

const initialForm = { username: '', password: '', name: '', surname: '', role: 'user' };

const generateStrongPassword = () => {
  const lowers = 'abcdefghijklmnopqrstuvwxyz';
  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{};:,.?';
  const all = lowers + uppers + digits + symbols;
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  let pwd = [pick(lowers), pick(uppers), pick(digits), pick(symbols)];
  while (pwd.length < 12) {
      pwd.push(pick(all));
  }
  // shuffle
  for (let i = pwd.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  return pwd.join('');
};

const Users = () => {
  const { isAdmin, authFetch } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number }>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [blocked, setBlocked] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);


  const onGeneratePassword = async () => {
    const pwd = generateStrongPassword();
    setForm((f) => ({ ...f, password: pwd }));
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pwd);
      }
    } catch {}
  };

  const onCopyPassword = async () => {
    try {
      if (form.password && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(form.password);
      }
    } catch {}
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Проверяем размер файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    setAvatarFile(file);

    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    // Очищаем input
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  const [editingId, setEditingId] = useState<number | null>(null);
  const [sessionsModalUser, setSessionsModalUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (blocked !== '') params.set('blocked', blocked);
    return params.toString();
  }, [pagination.page, pagination.limit, search, role, blocked]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authFetch(`/api/users?${queryString}`);
      const data = await res.json();
      setUsers(data.users || []);
      setPagination((p) => ({ ...p, total: data.pagination.total, pages: data.pagination.pages }));

      // Подгружаем количество активных сессий для каждого пользователя
      const counts = await Promise.all(
        (data.users || []).map(async (u: User) => {
          try {
            const r = await authFetch(`/api/users/${u.id}/sessions`);
            const s = await r.json();
            return { id: u.id, count: (s.sessions || []).length };
          } catch {
            return { id: u.id, count: 0 };
          }
        })
      );
      const map = new Map(counts.map((c) => [c.id, c.count]));
      setUsers((prev) => prev.map((u) => ({ ...u, sessionsCount: map.get(u.id) ?? 0 })));
    } catch (e: Error | any) {
      setError(e.message || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, [queryString, authFetch]);

  useEffect(() => {
    if (isAdmin()) fetchUsers();
  }, [queryString, fetchUsers, isAdmin]);

  const onCreate = async () => {
    try {
      if (!form.username || !form.password) throw new Error('Укажите логин и пароль');

      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('password', form.password);
      formData.append('name', form.name);
      formData.append('surname', form.surname);
      formData.append('role', form.role);

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await authFetch(`/api/users`, {
        method: 'POST',
        body: formData,
      });
      await res.json();
      setForm(initialForm);
      clearAvatar();
      fetchUsers();
    } catch (e: Error | any) {
      setError(e.message || 'Ошибка создания пользователя');
    }
  };

  const onUpdate = async (id: number) => {
    try {
      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('name', form.name);
      formData.append('surname', form.surname);
      formData.append('role', form.role);

      if (form.password) {
        formData.append('password', form.password);
      }

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await authFetch(`/api/users/${id}`, {
        method: 'PUT',
        body: formData,
      });
      await res.json();
      setEditingId(null);
      setForm(initialForm);
      clearAvatar();
      fetchUsers();
    } catch (e: Error | any) {
      setError(e.message || 'Ошибка обновления пользователя');
    }
  };

  const onToggleBlock = async (id: number, isBlocked: boolean) => {
    try {
      const res = await authFetch(`/api/users/${id}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_blocked: !isBlocked }),
      });
      await res.json();
      fetchUsers();
    } catch (e: Error | any) {
      setError(e.message || 'Ошибка смены статуса');
    }
  };

  const openSessions = async (user: User) => {
    setSessionsModalUser(user);
    try {
      const res = await authFetch(`/api/users/${user.id}/sessions`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e: Error | any) {
      setError(e.message || 'Ошибка загрузки сессий');
    }
  };

  const closeSessions = () => {
    setSessionsModalUser(null);
    setSessions([]);
  };

  const onDeleteSession = async (sessionId: number) => {
    if (!sessionsModalUser) return;
    try {
      await authFetch(`/api/users/${sessionsModalUser.id}/sessions/${sessionId}`, { method: 'DELETE' });
      // Обновляем список сессий в модалке
      const res = await authFetch(`/api/users/${sessionsModalUser.id}/sessions`);
      const data = await res.json();
      setSessions(data.sessions || []);
      // Обновляем счетчик в таблице пользователей
      setUsers((prev) => prev.map(u => u.id === sessionsModalUser.id ? { ...u, sessionsCount: (data.sessions || []).length } : u));
    } catch (e: Error | any) {
      setError(e.message || 'Ошибка завершения сессии');
    }
  };


  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Пользователи</h1>

      {/* Фильтры */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input className="border p-2 rounded" placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="border p-2 rounded" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="moderator">Модератор</option>
          <option value="writer">Редактор</option>
          <option value="user">Пользователь</option>
        </select>
        <select className="border p-2 rounded" value={blocked} onChange={(e) => setBlocked(e.target.value)}>
          <option value="">Все</option>
          <option value="true">Заблокированные</option>
          <option value="false">Активные</option>
        </select>
        <select className="border p-2 rounded" value={pagination.limit} onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setPagination((p) => ({ ...p, page: 1 }))}>Применить</button>
      </div>

      {/* Создание/редактирование */}
      <div className="border rounded p-3 mb-4">
        <h2 className="font-semibold mb-2">{editingId ? 'Изменить пользователя' : 'Добавить пользователя'}</h2>
        <div className="flex gap-2 flex-wrap">
          <input className="border p-2 rounded" placeholder="Логин" autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Имя" autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Фамилия" autoComplete="off" value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} />

          {/* Поле для загрузки аватара */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Аватар:</label>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="border p-2 rounded text-sm"
            />
            {avatarPreview && (
              <div className="flex items-center gap-2">
                <img src={avatarPreview} alt="Превью" className="w-8 h-8 rounded-full object-cover" />
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <input className="border p-2 rounded pr-28" type={showPassword ? 'text' : 'password'} placeholder="Пароль" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button
              type="button"
              title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.46-1.06 1.12-2.05 1.94-2.94m3.1-2.9A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-."></path>
                  <path d="M1 1l22 22"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
            <button
              type="button"
              title="Сгенерировать пароль"
              aria-label="Сгенерировать пароль"
              onClick={onGeneratePassword}
              className="absolute right-20 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 8l6 6"/>
                <path d="M4 14l6-6 2-3 3-2-2 3-3 2-6 6z"/>
                <path d="M2 22l4-1-3-3-1 4z"/>
              </svg>
            </button>
            <button
              type="button"
              title="Копировать пароль"
              aria-label="Копировать пароль"
              onClick={onCopyPassword}
              className="absolute right-11 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
          <select className="border p-2 rounded" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="admin">Администратор</option>
            <option value="moderator">Модератор</option>
            <option value="writer">Редактор</option>
            <option value="user">Пользователь</option>
          </select>
          {editingId ? (
            <>
              <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => onUpdate(editingId)}>Сохранить</button>
              <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => { setEditingId(null); setForm(initialForm); clearAvatar(); }}>Отмена</button>
            </>
          ) : (
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={onCreate}>Добавить</button>
          )}
        </div>
      </div>

      {/* Таблица пользователей */}
      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Аватар</th>
              <th className="p-2 border">Логин</th>
              <th className="p-2 border">Имя</th>
              <th className="p-2 border">Фамилия</th>
              <th className="p-2 border">Роль</th>
              <th className="p-2 border">Статус</th>
              <th className="p-2 border">Сессии</th>
              <th className="p-2 border">Создан</th>
              <th className="p-2 border">Последний вход</th>
              <th className="p-2 border">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{u.id}</td>
                <td className="p-2 border">
                  <AvatarDisplay user={u} />
                </td>
                <td className="p-2 border">{u.username}</td>
                <td className="p-2 border">{u.name}</td>
                <td className="p-2 border">{u.surname}</td>
                <td className="p-2 border">{u.role}</td>
                <td className="p-2 border">{u.is_blocked ? 'Заблокирован' : 'Активен'}</td>
                <td className="p-2 border">
                  <button className="underline" title="Посмотреть сессии" onClick={() => openSessions(u)}>
                    {u.sessionsCount ?? 0}
                  </button>
                </td>
                <td className="p-2 border">{formatDate(u.created_at)}</td>
                <td className="p-2 border">{formatDate(u.last_login)}</td>
                <td className="p-2 border space-x-2">
                  <button
                    className="inline-flex items-center justify-center p-1.5 rounded hover:bg-gray-100 border"
                    title="Изменить пользователя"
                    aria-label="Изменить пользователя"
                    onClick={() => {
                      setEditingId(u.id);
                      setForm({ username: u.username, password: '', name: u.name || '', surname: u.surname || '', role: u.role });
                      clearAvatar();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                  <button
                    className="inline-flex items-center justify-center p-1.5 rounded hover:bg-gray-100 border"
                    title={u.is_blocked ? 'Разблокировать пользователя' : 'Заблокировать пользователя'}
                    aria-label={u.is_blocked ? 'Разблокировать пользователя' : 'Заблокировать пользователя'}
                    onClick={() => onToggleBlock(u.id, !!u.is_blocked)}
                  >
                    {u.is_blocked ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        <path d="M12 15v4"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td className="p-2 border text-center" colSpan={11}>Нет данных</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="flex items-center gap-2 mt-3">
        <button disabled={pagination.page <= 1} className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Назад</button>
        <span>Стр. {pagination.page} из {pagination.pages}</span>
        <button disabled={pagination.page >= pagination.pages} className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Вперёд</button>
      </div>

      {loading && <div className="mt-2">Загрузка...</div>}
      {error && <div className="mt-2 text-red-600">{error}</div>}

      {/* Модалка сессий */}
      {sessionsModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded p-4 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Сессии: {sessionsModalUser.username}</h3>
              <button onClick={closeSessions} className="px-3 py-1 border rounded">Закрыть</button>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Device</th>
                    <th className="p-2 border">IP</th>
                    <th className="p-2 border">UA</th>
                    <th className="p-2 border">Создана</th>
                    <th className="p-2 border">Активность</th>
                    <th className="p-2 border">Статус</th>
                    <th className="p-2 border">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border">{s.id}</td>
                      <td className="p-2 border">{s.device_id}</td>
                      <td className="p-2 border">{s.ip_address}</td>
                      <td className="p-2 border">{s.user_agent?.slice(0, 60)}</td>
                      <td className="p-2 border">{formatDate(s.created_at)}</td>
                      <td className="p-2 border">{formatDate(s.last_activity)}</td>
                      <td className="p-2 border">{s.is_active ? 'Активна' : 'Завершена'}</td>
                      <td className="p-2 border">
                        {s.is_active && (
                          <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => onDeleteSession(s.id)}>Завершить</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr>
                      <td className="p-2 border text-center" colSpan={8}>Нет активных сессий</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;


