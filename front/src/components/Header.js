// src/components/Header.js
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gray-100 p-4 mb-6 shadow-sm sticky top-0">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 hover:underline">
          Галерея Мемов
        </Link>
        <div className="flex items-center gap-4">
        {
          user && (
            <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
              Выйти
            </button>
          )
        }
        </div>
      </div>
    </header>
  );
};


export default Header;
