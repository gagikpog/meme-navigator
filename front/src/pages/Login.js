import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {refreshMemes} = useMemes()

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error('Неверные данные');

      const { token } = await res.json();
      localStorage.setItem('token', token);
      
      await refreshMemes();
      navigate('/');
    } catch {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Вход администратора</h2>
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
