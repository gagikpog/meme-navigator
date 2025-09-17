// src/components/Header.js
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 backdrop-blur bg-white/70 border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          Галерея Мемов
        </Link>
        <div className="flex items-center gap-4">
          {user && isAdmin() && (
            <Link to="/admin/users" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">Пользователи</Link>
          )}
          {user && (
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 transition-colors">
              Выйти
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


export default Header;
