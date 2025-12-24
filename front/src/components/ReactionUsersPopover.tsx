import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import AvatarDisplay from './AvatarDisplay';
import { User } from '../types';

type ReactionType = 'like' | 'dislike';

interface ReactionUsersPopoverProps {
  memeId: number;
  type: ReactionType;
  children: ReactNode;
  align?: 'left' | 'right';
}

const ReactionUsersPopover = ({ memeId, type, children, align = 'left' }: ReactionUsersPopoverProps) => {
  const { authFetch } = useAuth();
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const loadUsers = useCallback(async () => {
    if (isLoaded || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/ratings/meme/${memeId}/users?type=${type}`);
      if (!res.ok) {
        throw new Error('Не удалось загрузить список реакций');
      }
      const data = await res.json();
      setUsers(data.users || []);
      setIsLoaded(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки списка реакций');
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, isLoaded, isLoading, memeId, type]);

  const updatePosition = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gap = 8;
    const left = align === 'right' ? rect.right + window.scrollX : rect.left + window.scrollX;
    const top = rect.bottom + gap + window.scrollY;
    setPosition({ top, left });
  }, [align]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    updatePosition();
    void loadUsers();
  }, [loadUsers, updatePosition]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) {
        handleClose();
      } else {
        handleOpen();
      }
    },
    [handleClose, handleOpen, isOpen]
  );

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, updatePosition]);

  return (
    <div
      ref={anchorRef}
      className="relative inline-flex"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onClick={handleClick}
    >
      {children}
      {isOpen &&
        createPortal(
          <div
            className="rounded-lg bg-white shadow-lg border border-gray-200 p-2 z-[1000]"
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              transform: align === 'right' ? 'translateX(-100%)' : 'none'
            }}
          >
            {isLoading && (
              <div className="text-xs text-gray-500 px-1 py-0.5">Загрузка...</div>
            )}
            {!isLoading && error && (
              <div className="text-xs text-red-600 px-1 py-0.5">{error}</div>
            )}
            {!isLoading && !error && users.length === 0 && (
              <div className="text-xs text-gray-500 px-1 py-0.5">Пока никто</div>
            )}
            {!isLoading && !error && users.length > 0 && (
              <div className="flex flex-wrap gap-2 max-w-[240px]">
                {users.map((user) => (
                  <AvatarDisplay key={user.id} user={user} className="w-6 h-6" />
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default ReactionUsersPopover;

