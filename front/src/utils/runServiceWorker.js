import  urlBase64ToUint8Array  from './urlBase64ToUint8Array';
import { VAPID_PUBLIC } from '../config';
import { authFetch } from './authFetch';

export default function runServiceWorker() {

    // Register service worker in production builds
    if ( 'serviceWorker' in navigator) {
        console.log('Registering service worker');
        const version = 1;
        isCurrentVersion(version).then((done) => {
            if (!done) {
                console.log('Service Worker: Version changed');
                return unregister().then((needReload) => {
                    if (needReload) {
                        window.navigation.reload();
                        return;
                    }
                    return register(version);
                }).catch((error) => {
                    console.log('Service Worker: Update failed with' + error);
                });
            }
        }).finally(() => {
            getNotifyPermission(version);
        });
    }
}
function register(version) {
    // Register service worker in production builds
    console.log('Loading service worker');
    return navigator.serviceWorker
    .register(`/service-worker.js?v=${version}`)
    .then(async (reg) => {
        console.log('Registration successful, scope is:', reg.scope);
        return reg;
    })
    .catch((error) => {
        console.error('Service Worker registration failed:', error);
    });
}

async function getNotifyPermission(version) {

    const reg = await navigator.serviceWorker.getRegistrations()
    .then((regList) => {
        return regList.find((reg) => {
            return reg.active?.state === 'activated' && compareVersion(reg.active?.scriptURL, version)
        });
    })
    .catch(() => false);

    if (!reg) {
        console.error('Не получилось подписаться на оповещения');
        return;
    }

    const permission = await Notification.requestPermission();
    console.log('Permission:', permission);
    if (permission !== 'granted') {
        return;
    }

    // Проверяем, есть ли уже подписка
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
        // Подписка отсутствует → создаём новую
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
        });
        console.log('Создана новая подписка');
    } else {
        console.log('Подписка уже существует');
    }

    await authFetch('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' }
    });
}

function unregister() {
    return navigator.serviceWorker.getRegistrations()
        .then((regList) => Promise.all(regList.map((reg) => reg.unregister())))
        .then((res) => res.length ? res.every(Boolean) : false)
        .catch(() => false);
}

function isCurrentVersion(version) {
    return navigator.serviceWorker.getRegistrations()
        .then((regList) => {
            return !!regList.find((reg) => {
                return reg.active?.state === 'activated' && compareVersion(reg.active?.scriptURL, version)
            });
        })
        .catch(() => false);
}

function compareVersion(url, version) {
    try {
        const ver = new URL(url).searchParams.get('v');
        return Number(ver) === version;
    } catch (error) {
        return false;
    }
}