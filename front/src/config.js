export const isDebug = !(window.localStorage.getItem('isDebug') !== 'on');
export const API_URL = isDebug ? 'http://localhost:8003' : 'https:/gagikpog-api.ru/meme';
export const IMAGE_URL = '/images';
