import urlBase64ToUint8Array from './urlBase64ToUint8Array';
import { VAPID_PUBLIC } from '../config';
import { authorizationFetch } from './authFetch';

const VERSION = 1;

const register = async (version: number): Promise<ServiceWorkerRegistration | void> => {
  try {
    const registration = await navigator.serviceWorker.register(`/service-worker.js?v=${version}`);
    console.log('Registration successful, scope is:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
};

const compareVersion = (url: string | undefined, version: number): boolean => {
  if (!url) return false;
  try {
    const ver = new URL(url).searchParams.get('v');
    return Number(ver) === version;
  } catch {
    return false;
  }
};

const isCurrentVersion = async (version: number): Promise<boolean> => {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.some(
      (registration) =>
        registration.active?.state === 'activated' &&
        compareVersion(registration.active?.scriptURL, version)
    );
  } catch {
    return false;
  }
};

const unregister = async (): Promise<boolean> => {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const results = await Promise.all(registrations.map((registration) => registration.unregister()));
    return results.length > 0 ? results.every(Boolean) : false;
  } catch {
    return false;
  }
};

const getNotifyPermission = async (version: number): Promise<void> => {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const activeRegistration = registrations.find(
      (registration) =>
        registration.active?.state === 'activated' &&
        compareVersion(registration.active?.scriptURL, version)
    );

    if (!activeRegistration) {
      console.error('Не получилось подписаться на оповещения');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return;
    }

    let subscription = await activeRegistration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await activeRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource
      });
    }

    await authorizationFetch('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Ошибка подписки на уведомления', error);
  }
};

export default function runServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  isCurrentVersion(VERSION)
    .then(async (current) => {
      if (!current) {
        const needReload = await unregister();
        if (needReload) {
          window.location.reload();
          return;
        }
        await register(VERSION);
      }
    })
    .catch((error) => console.log('Service Worker: Update failed with', error))
    .finally(() => {
      void getNotifyPermission(VERSION);
    });
}