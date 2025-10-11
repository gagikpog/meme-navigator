import { API_URL } from "../config";

export const authFetch = (url, options = {}) => {
  const token = localStorage.getItem('token');
  const deviceId = localStorage.getItem('deviceId');
  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'device-id': deviceId
    },
  }).then(async (response) => {

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.location.href = '/login/';
    }

    if (!response.ok) {
      throw new Error((await response.json())?.message);
    }
    return response;
  });
};
