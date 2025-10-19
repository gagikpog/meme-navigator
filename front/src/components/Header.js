// src/components/Header.js
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import AvatarDisplay from './AvatarDisplay';
import DropdownMenu from './DropdownMenu';
import { useMemo } from 'react';
import IconTimeline from '../icons/Timeline';
import IconRss from '../icons/Rss';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleSelect = (item) => {
    switch (item.key) {
      case 'logout':
        logout();
        navigate('/login');
        break;
      case 'rss':
        const token = localStorage.getItem('token');
        if (token) {
          const url = `${API_URL}/rss.xml?authorization=${encodeURIComponent(token)}`;
          navigator.clipboard.writeText(url);
        }
        break;
      default:
        break;
    }
  };

  const menuItems = useMemo(() => {
    return [
      { key: "timeline", name: "Хронология", visible: true, url: "/timeline", icon: <IconTimeline/>},
      { key: "users", name: "Пользователи", visible: isAdmin(), url: "/admin/users", icon: <span>👥</span>},
      { key: "rss", name: "RSS", visible: true, title: "Скопировать RSS ссылку", icon: <IconRss/>},
      { key: "logout", name: "Выйти", visible: true },
    ];
  }, [isAdmin]);

  return (
    <header className="sticky top-0 backdrop-blur bg-white/70 border-b z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          Галерея Мемов
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <DropdownMenu
              options={menuItems}
              onSelect={handleSelect}
              button={<AvatarDisplay user={user} className="cursor-pointer"/>}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
