import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
const fallbackPath = '/';

export default function useSmartBack() {
    const navigate = useNavigate();
    const location = useLocation();

    const goBack = useCallback(() => {
        const currentKey = location.key;
        const referrer = document.referrer;
        const isSameOrigin = referrer && referrer.startsWith(window.location.origin);

        // Если история пуста
        if (window.history.length <= 1) {
            navigate(fallbackPath, { replace: true });
            return;
        }

        // Если пользователь пришёл с другого домена
        if (!referrer || !isSameOrigin) {
            navigate(fallbackPath, { replace: true });
            return;
        }

        // Пробуем перейти назад
        navigate(-1);

        // Проверяем, сработала ли навигация
        setTimeout(() => {
            if (location.key === currentKey) {
                // если не сработало — fallback
                navigate(fallbackPath, { replace: true });
            }
        }, 100);
    }, [navigate, location]);

    return goBack;
}
