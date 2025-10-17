const db = require("../db/database");
const webpush = require("web-push");

function sendNotifications(data, filter = {}) {

    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);

        // Админы видят все мемы
        let query = `
            SELECT
                subscriptions.*, users.role
            FROM subscriptions
            LEFT JOIN users
                ON subscriptions.user_id = users.id
            LEFT JOIN user_sessions
                ON subscriptions.session_id = user_sessions.id
            WHERE user_sessions.is_active = 1
        `;
        let params = [];

        if (filter.userIds?.length) {
            query += ' AND subscriptions.user_id IN (' + filter.userIds.map(() => '?').join(',') + ')';
            params.push(...filter.userIds);
        }

        if (filter.sessionIds?.length) {
            query += ' AND';
            query += ' subscriptions.session_id IN (' + filter.sessionIds.map(() => '?').join(',') + ')';
            params.push(...filter.sessionIds);
        }

        console.log("Executing query:", query, params);

        db.all(query, params, async (err, rows) => {
            if (err) {
                console.error("Ошибка чтения подписок:", err);
                return reject("Ошибка базы данных");
            }

            rows = filterSubscriptionsSession(rows, filter);

            console.log(`notify to ${rows.length} subscriptions, payload: ${payload}`, rows);

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

/**
 * Фильтрует подписки по активным сессиям и правам доступа
 */
function filterSubscriptionsSession(rows, filter) {
    // Фильтруем по исключающим спискам
    const excludeSessionIds = new Set(filter.excludeSessionIds || []);
    const excludeUserIds = new Set(filter.excludeUserIds || []);
    const permissions = Array.isArray(filter.permissions) ? filter.permissions : [filter.permissions];

    return rows.filter((row) => {
        if (excludeSessionIds.has(row.session_id)) return false;
        if (excludeUserIds.has(row.user_id)) return false;
        if (permissions.length) {
            return permissions.includes(row.role);
        }
        return true;
    });
}

module.exports = sendNotifications;
