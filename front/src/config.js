export const isDebug = !(window.localStorage.getItem('isDebug') !== 'on');
export const API_URL = isDebug ? 'http://localhost:4000/meme' : 'https://gagikpog-api.ru/meme';
export const IMAGE_URL = '/images';
export const VAPID_PUBLIC = 'BBnglgO8I-r5s-0EgMhRVWbqhCKteMsqZeMhmuOcdFj_CMXrz22ZhSWpKqdr9Pf0e3oM59zVPZTbUBhvKtPX_xw';

if (typeof window !== 'undefined') {
    window.setDebug = (value = true) => {
        window.localStorage.setItem('isDebug', value ? 'on' : 'off');
        document.location.reload();
    }
}
