import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import AvatarDisplay from './AvatarDisplay';
import DropdownMenu, { IMenuOptions } from './DropdownMenu';
import { useMemo } from 'react';
import IconTimeline from '../icons/Timeline';
import IconRss from '../icons/Rss';
import IconUsers from '../icons/Users';
import IconLogout from '../icons/Logout';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleSelect = (item: IMenuOptions) => {
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

  const menuItems = useMemo<IMenuOptions[]>(() => {
    return [
      { key: "timeline", name: "Хронология", visible: true, url: "/timeline", icon: <IconTimeline size={16}/>},
      { key: "users", name: "Пользователи", visible: isAdmin(), url: "/admin/users", icon: <IconUsers size={16} />},
      { key: "rss", name: "RSS", visible: true, title: "Скопировать RSS ссылку", icon: <IconRss size={16}/>},
      { key: "logout", name: "Выйти", visible: true, icon: <IconLogout size={16} /> },
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
