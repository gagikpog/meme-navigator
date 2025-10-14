// src/components/Header.js
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 backdrop-blur bg-white/70 border-b z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          Галерея Мемов
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <button
              type="button"
              onClick={() => {
                const token = localStorage.getItem('token');
                if (!token) return;
                const url = `${API_URL}/rss.xml?authorization=${encodeURIComponent(token)}`;
                navigator.clipboard.writeText(url);
              }}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50"
              title="Скопировать RSS ссылку"
            >
              <span className="text-gray-700">RSS</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-gray-400"><path d="M4 12a8 8 0 0 1 8 8"/><path d="M4 6a14 14 0 0 1 14 14"/><circle cx="5" cy="19" r="1"/></svg>
            </button>
          )}
          {user && isAdmin() && (
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              title="Пользователи"
            >
              <span className="hidden sm:inline">Пользователи</span>
              <span className="sm:hidden">👥</span>
            </Link>
          )}
          {user && (
           <Link
              to="/timeline"
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              title="Хронология"
            >
              <span>
                <svg width="16px" height="16px" viewBox="0 0 48 48" fill="none">
                  <g clip-path="url(#clip0)">
                  <rect width="48" height="48" fill="white" fill-opacity="0.01"/>
                  <path d="M48 0H0V48H48V0Z" fill="white" fill-opacity="0.01"/>
                  <path d="M13 12C13 14.2091 14.7909 16 17 16C19.2091 16 21 14.2091 21 12C21 9.79086 19.2091 8 17 8C14.7909 8 13 9.79086 13 12Z" fill="#2F88FF" stroke="#000000" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M31 24C31 26.2091 32.7909 28 35 28C37.2091 28 39 26.2091 39 24C39 21.7909 37.2091 20 35 20C32.7909 20 31 21.7909 31 24Z" fill="#2F88FF" stroke="#000000" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M13 36C13 38.2091 14.7909 40 17 40C19.2091 40 21 38.2091 21 36C21 33.7909 19.2091 32 17 32C14.7909 32 13 33.7909 13 36Z" fill="#2F88FF" stroke="#000000" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M4 36H13" stroke="#000000" stroke-width="4" stroke-linecap="round"/>
                  <path d="M21 36H44" stroke="#000000" stroke-width="4" stroke-linecap="round"/>
                  <path d="M4 12H13" stroke="#000000" stroke-width="4" stroke-linecap="round"/>
                  <path d="M21 12H44" stroke="#000000" stroke-width="4" stroke-linecap="round"/>
                  <path d="M4 4V44" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M4 24H31" stroke="#000000" stroke-width="4" stroke-linecap="round"/>
                  <path d="M39 24H44" stroke="#000000" stroke-width="4" stroke-linecap="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0">
                    <rect width="48" height="48" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </span>
            </Link>
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
