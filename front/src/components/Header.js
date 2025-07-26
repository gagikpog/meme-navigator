// src/components/Header.js
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="bg-gray-100 p-4 mb-6 shadow-sm">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 hover:underline">
          Галерея Мемов
        </Link>
        <button onClick={logout} className="text-sm text-red-600 hover:underline">
          Выйти
        </button>
      </div>
    </header>
  );
};


export default Header;
