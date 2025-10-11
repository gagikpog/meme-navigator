const db = require("../db/database");
const webpush = require("web-push");

function sendNotifications(data, filter = {}) {

    const payload = JSON.stringify(data);

    return new Promise((resolve, reject) => {

        // Админы видят все мемы
        let query = 'SELECT * FROM subscriptions';
        let params = [];

        if (filter.userIds?.length) {
            query += ' WHERE user_id IN (' + filter.userIds.map(() => '?').join(',') + ')';
            params.push(...filter.userIds);
        }

        if (filter.sessionIds?.length) {
            query += params.length ? ' AND' : ' WHERE';
            query += ' session_id IN (' + filter.sessionIds.map(() => '?').join(',') + ')';
            params.push(...filter.sessionIds);
        }

        db.all(query, params, async (err, rows) => {
            if (err) {
                console.error("Ошибка чтения подписок:", err);
                return reject("Ошибка базы данных");
            }

            rows = await filterSubscriptionsByActiveSession(rows);

            console.log(`notify to ${rows.length} subscriptions, payload: ${payload}`);

            const results = await Promise.all(
                rows.map(async (sub) => {
                    const subscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.keys_p256dh,
                            auth: sub.keys_auth,
                        },
                    };

                    try {
                        await webpush.sendNotification(subscription, payload);
                        return { endpoint: sub.endpoint, status: "ok" };
                    } catch (err) {
                        console.error("Ошибка Push:", err.statusCode, err, sub.endpoint);

                        // Если подписка больше неактуальна — удаляем
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            db.run("DELETE FROM subscriptions WHERE endpoint = ?", [
                                sub.endpoint,
                            ]);
                            console.log("🗑 Удалена устаревшая подписка:", sub.endpoint);
                        }
                        return { endpoint: sub.endpoint, status: "failed" };
                    }
                })
            );

            resolve({ message: "Уведомления отправлены", results });
        });
    });
}

function filterSubscriptionsByActiveSession(rows) {
    return new Promise((resolve, reject) => {
        const sessionIds = [...new Set(rows.map(r => r.session_id).filter(id => id))].join(',');

        db.all("SELECT id from user_sessions WHERE is_active = 1 AND id IN (?)", [sessionIds], (err, sessions) => {
            if (err) {
                console.error("Ошибка чтения активных сессий:", err);
                reject("Ошибка базы данных");
                return;
            }
            const sessionSet = new Set(sessions ? sessions.map(s => s.id) : []);
            resolve(rows.filter(r => sessionSet.has(r.session_id)));
        });
    });
}

module.exports = sendNotifications;
