import { API_URL } from "../config";

export const authorizationFetch = (url, options = {}) => {
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

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.location.href = '/login/';
    }

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error);
    }
    return response;
  });
};
