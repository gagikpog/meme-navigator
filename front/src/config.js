export const isDebug = !(window.localStorage.getItem('isDebug') !== 'on');
export const API_URL = isDebug ? 'http://localhost:8003/meme' : 'https://gagikpog-api.ru/meme';
export const IMAGE_URL = '/images';

if (typeof window !== 'undefined') {
    window.setDebug = (value = true) => {
        window.localStorage.setItem('isDebug', value ? 'on' : 'off');
        document.location.reload();
    }
}
