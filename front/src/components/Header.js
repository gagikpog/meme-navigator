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
                <svg width="16" height="16" viewBox="0 0 48 48" stroke="currentColor" fill="#fff" strokeWidth="2" strokeLinecap="round">
                  <path d="M 43.903647,4 H 4.098789" strokeWidth="4" />
                  <path d="M 24,4.2285755 V 43.571404" strokeWidth="3" />
                  <g transform="translate(0.092388,1.1301115)">
                    <path d="M 32.411973,11.326074 H 26.205706" />
                    <circle cx="36.8" cy="11.5" r="4" />
                    <circle cx="23.8" cy="11.247408" r="2" />
                  </g>
                  <g transform="matrix(-1,0,0,1,48.055811,8.5567916)">
                    <path d="M 32.411973,11.326074 H 26.205706" />
                    <circle cx="36.8" cy="11.5" r="4" />
                    <circle cx="23.8" cy="11.247408" r="2" />
                  </g>
                  <g transform="translate(0.092388,24.600582)">
                    <path d="M 32.411973,11.326074 H 26.205706" />
                    <circle cx="36.8" cy="11.5" r="4" />
                    <circle cx="23.8" cy="11.247408" r="2" />
                  </g>

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
