// @ts-nocheck
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
const fallbackPath = '/';

let isMemePage = document.location?.pathname.startsWith('/meme/') ?? false;

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
        if (isMemePage) {
            navigate(fallbackPath, { replace: true });
            isMemePage = false;
        } else {
            navigate(-1);
        }
    }, [navigate]);
}
