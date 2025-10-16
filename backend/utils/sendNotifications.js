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

            rows = await filterSubscriptionsSession(rows, filter);

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

/**
 * Фильтрует подписки по активным сессиям и правам доступа
 */
function filterSubscriptionsSession(rows, filter) {
    return new Promise((resolve, reject) => {
        const sessionIds = [...new Set(rows.map(r => r.session_id).filter(Boolean))];

        db.all(`SELECT id, user_id from user_sessions WHERE is_active = 1 AND id IN (${sessionIds.map(() => '?').join(',')})`, sessionIds, async (err, sessions) => {
            if (err) {
                console.error("Ошибка чтения активных сессий:", err);
                reject("Ошибка базы данных");
                return;
            }

            // Фильтруем по исключающим спискам
            const excludeSessionIds = new Set(filter.excludeSessionIds || []);
            const excludeUserIds = new Set(filter.excludeUserIds || []);

            const sessionSet = new Set(sessions ? sessions.filter((session) => {
                if (excludeSessionIds.has(session.id)) return false;
                if (excludeUserIds.has(session.user_id)) return false;
                return session.id
            }).map(s => s.id) : []);

            // Если указаны права доступа, фильтруем по ним
            if (filter.permissions?.length && sessionSet.size) {
                const userIds = [
                    ...new Set(
                    sessions
                        .filter((session) => sessionSet.has(session.id))
                        .map((session) => session.user_id)
                    ),
                ];
                try {
                    const permissionsMap = await getUsersPromises(userIds)
                    const permissions = Array.isArray(filter.permissions) ? filter.permissions : [filter.permissions];
                    // Оставляем только сессии пользователей с ролью admin или writer
                    sessions.forEach((session) => {
                        const role = permissionsMap.get(session.user_id) || 'user';
                        if (!permissions.includes(role)) {
                            sessionSet.delete(session.id);
                        }
                    });
                } catch (error) {
                    console.error("Ошибка чтения пользователей:", error);
                    return reject("Ошибка базы данных");
                }
            }

            resolve(rows.filter(r => sessionSet.has(r.session_id)));
        });
    });
}

function getUsersPromises(userIds) {
    return new Promise((resolve, reject) => {
        if (!userIds || !userIds.length) return resolve([]);

        const placeholders = userIds.map(() => '?').join(',');
        const query = `SELECT id, role FROM users WHERE id IN (${placeholders})`;

        db.all(query, userIds, (err, rows) => {
            if (err) {
                console.error("Ошибка чтения пользователей:", err);
                return reject("Ошибка базы данных");
            }

            const permissionsMap = new Map();

            rows.forEach((row) => {
                permissionsMap.set(row.id, row.role || 'user');
            });

            resolve(permissionsMap);
        });
    });
}

module.exports = sendNotifications;
