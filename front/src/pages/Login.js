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
  const { refreshMemes } = useMemes();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, deviceId: localStorage.getItem('deviceId') }),
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
    } catch (err) {
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
        <input
          className="border p-2 w-full mb-2 rounded"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full">
          Войти
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default Login;
