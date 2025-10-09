import { API_URL } from "../config";

export const authFetch = (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  }).then(async (response) => {

    if (response.status === 401 || response.status === 403) {
      document.location.href = '/login/';
    }

    if (!response.ok) {
      throw new Error((await response.json())?.message);
    }
    return response;
  });
};
