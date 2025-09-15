import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import { useAuth } from '../context/AuthContext';

const initialForm = { username: '', password: '', role: 'user' };

const formatShort = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d)) {
      // fallback если пришла не ISO-строка
      const s = String(value);
      const base = s.slice(0, 10);
      const [y, m, d2] = base.split('-');
      if (y && m && d2) return `${d2}.${m}.${String(y).slice(-2)} ${s.slice(11,16)}`;
      return s;
    }
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yy} ${hh}:${min}`;
};

const Users = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [blocked, setBlocked] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [sessionsModalUser, setSessionsModalUser] = useState(null);
  const [sessions, setSessions] = useState([]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', pagination.page);
    params.set('limit', pagination.limit);
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (blocked !== '') params.set('blocked', blocked);
    return params.toString();
  }, [pagination.page, pagination.limit, search, role, blocked]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authFetch(`/api/users?${queryString}`);
      const data = await res.json();
      setUsers(data.users || []);
      setPagination((p) => ({ ...p, total: data.pagination.total, pages: data.pagination.pages }));

      // Подгружаем количество активных сессий для каждого пользователя
      const counts = await Promise.all(
        (data.users || []).map(async (u) => {
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
    } catch (e) {
      setError(e.message || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) fetchUsers();
  }, [queryString]);

  const onCreate = async () => {
    try {
      if (!form.username || !form.password) throw new Error('Укажите логин и пароль');
      const res = await authFetch(`/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      await res.json();
      setForm(initialForm);
      fetchUsers();
    } catch (e) {
      setError(e.message || 'Ошибка создания пользователя');
    }
  };

  const onUpdate = async (id) => {
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const res = await authFetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await res.json();
      setEditingId(null);
      setForm(initialForm);
      fetchUsers();
    } catch (e) {
      setError(e.message || 'Ошибка обновления пользователя');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      const res = await authFetch(`/api/users/${id}`, { method: 'DELETE' });
      await res.json();
      fetchUsers();
    } catch (e) {
      setError(e.message || 'Ошибка удаления пользователя');
    }
  };

  const onToggleBlock = async (id, isBlocked) => {
    try {
      const res = await authFetch(`/api/users/${id}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_blocked: !isBlocked }),
      });
      await res.json();
      fetchUsers();
    } catch (e) {
      setError(e.message || 'Ошибка смены статуса');
    }
  };

  const openSessions = async (user) => {
    setSessionsModalUser(user);
    try {
      const res = await authFetch(`/api/users/${user.id}/sessions`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки сессий');
    }
  };

  const closeSessions = () => {
    setSessionsModalUser(null);
    setSessions([]);
  };

  const onDeleteSession = async (sessionId) => {
    if (!sessionsModalUser) return;
    try {
      await authFetch(`/api/users/${sessionsModalUser.id}/sessions/${sessionId}`, { method: 'DELETE' });
      // Обновляем список сессий в модалке
      const res = await authFetch(`/api/users/${sessionsModalUser.id}/sessions`);
      const data = await res.json();
      setSessions(data.sessions || []);
      // Обновляем счетчик в таблице пользователей
      setUsers((prev) => prev.map(u => u.id === sessionsModalUser.id ? { ...u, sessionsCount: (data.sessions || []).length } : u));
    } catch (e) {
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
          <option value="admin">admin</option>
          <option value="writer">writer</option>
          <option value="user">user</option>
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
          <input className="border p-2 rounded" placeholder="Логин" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="border p-2 rounded" type="password" placeholder="Пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="border p-2 rounded" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="user">user</option>
            <option value="writer">writer</option>
            <option value="admin">admin</option>
          </select>
          {editingId ? (
            <>
              <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => onUpdate(editingId)}>Сохранить</button>
              <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => { setEditingId(null); setForm(initialForm); }}>Отмена</button>
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
              <th className="p-2 border">Логин</th>
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
                <td className="p-2 border">{u.username}</td>
                <td className="p-2 border">{u.role}</td>
                <td className="p-2 border">{u.is_blocked ? 'Заблокирован' : 'Активен'}</td>
                <td className="p-2 border">
                  <button className="underline" title="Посмотреть сессии" onClick={() => openSessions(u)}>
                    {u.sessionsCount ?? 0}
                  </button>
                </td>
                <td className="p-2 border">{formatShort(u.created_at)}</td>
                <td className="p-2 border">{formatShort(u.last_login)}</td>
                <td className="p-2 border space-x-2">
                  <button
                    className="inline-flex items-center justify-center p-1.5 rounded hover:bg-gray-100 border"
                    title="Изменить пользователя"
                    aria-label="Изменить пользователя"
                    onClick={() => { setEditingId(u.id); setForm({ username: u.username, password: '', role: u.role }); }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                  <button
                    className="inline-flex items-center justify-center p-1.5 rounded hover:bg-gray-100 border text-red-600"
                    title="Удалить пользователя"
                    aria-label="Удалить пользователя"
                    onClick={() => onDelete(u.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/>
                      <path d="M14 11v6"/>
                      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
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
                <td className="p-2 border text-center" colSpan={8}>Нет данных</td>
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
                      <td className="p-2 border">{formatShort(s.created_at)}</td>
                      <td className="p-2 border">{formatShort(s.last_activity)}</td>
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


