import { API_URL } from '../config';

export const authorizationFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token') ?? '';
  const deviceId = localStorage.getItem('deviceId') ?? '';

  const headers: HeadersInit = {
    ...(options.headers as HeadersInit),
    Authorization: `Bearer ${token}`,
    'device-id': deviceId
  };

  return fetch(`${API_URL}${url}`, {
    ...options,
    headers
  }).then(async (response) => {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.location.href = '/login/';
    }

    if (!response.ok) {
      const result: { error?: string } = await response.json();
      throw new Error(result.error ?? 'Unknown error');
    }
    return response;
  });
};
