import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
const fallbackPath = '/';

/**
 * useSmartBack — безопасный "назад":
 * - не уводит на другой домен или about:blank
 * - если истории нет => fallback
 * - если navigate(-1) не вызвал popstate => fallback
 * - полностью очищает слушатели и таймеры
 */
export default function useSmartBack() {
    const navigate = useNavigate();

    return useCallback(() => {
        const ref = document.referrer;
        const fromAnotherDomain = ref && !ref.startsWith(window.location.origin);

        // Пришли с другого домена → сразу на главную
        if (fromAnotherDomain) {
            navigate(fallbackPath, { replace: true });
            return;
        }

        // Если история пуста или состоит только из about:blank
        const prevIsBlank =
            window.history.length <= 1 ||
            (window.performance?.getEntriesByType("navigation")[0]?.type === "navigate" &&
                !ref);

        if (prevIsBlank) {
            navigate(fallbackPath, { replace: true });
            return;
        }

        // Пробуем назад, если история "живая"
        const before = window.location.href;
        navigate(-1);

        // Если URL не поменялся — fallback
        setTimeout(() => {
            if (window.location.href === before) {
                navigate(fallbackPath, { replace: true });
            }
        }, 200);
    }, [navigate]);
}
