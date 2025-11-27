import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { refreshMemes } = useMemes();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'device-id': localStorage.getItem('deviceId') } as HeadersInit,
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Неверные данные');
      }

      const { token, user } = await res.json();

      if (!user) {
        throw new Error('Данные пользователя не получены');
      }

      login(user, token);

      navigate('/');
      refreshMemes();
    } catch (err: Error | any) {
      setError(err.message || 'Неверный логин или пароль');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Вход в систему</h2>
      <form onSubmit={handleLogin}>
        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="relative mb-2">
          <input
            className="border p-2 w-full rounded pr-10"
            type={showPassword ? 'text' : 'password'}
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full">
          Войти
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default Login;
