import db from '../db/database';
import webpush from 'web-push';
import { NotificationData, NotificationFilter, PushSubscription } from '../types';

function sendNotifications(
    data: NotificationData,
    filter: NotificationFilter = {}
): Promise<{ message: string; results: Array<{ endpoint: string; status: string }> }> {
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
        let params: any[] = [];

        if (filter.userIds?.length) {
            query += ' AND subscriptions.user_id IN (' + filter.userIds.map(() => '?').join(',') + ')';
            params.push(...filter.userIds);
        }

        if (filter.sessionIds?.length) {
            query += ' AND';
            query += ' subscriptions.session_id IN (' + filter.sessionIds.map(() => '?').join(',') + ')';
            params.push(...filter.sessionIds);
        }

        db.all(query, params, async (err: Error | null, rows: any[]) => {
            if (err) {
                console.error('Ошибка чтения подписок:', err);
                return reject('Ошибка базы данных');
            }

            const filteredRows = filterSubscriptionsSession(rows, filter);

            console.log(`notify to ${filteredRows.length} subscriptions, payload: ${payload}`);

            const results = await Promise.all(
                filteredRows.map(async (sub: any) => {
                    const subscription: PushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.keys_p256dh,
                            auth: sub.keys_auth,
                        },
                    };

                    try {
                        await webpush.sendNotification(subscription, payload);
                        return { endpoint: sub.endpoint, status: 'ok' };
                    } catch (err: any) {
                        console.error('Ошибка Push:', err.statusCode, err, sub.endpoint);

                        // Если подписка больше неактуальна — удаляем
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            db.run('DELETE FROM subscriptions WHERE endpoint = ?', [sub.endpoint]);
                            console.log('🗑 Удалена устаревшая подписка:', sub.endpoint);
                        }
                        return { endpoint: sub.endpoint, status: 'failed' };
                    }
                })
            );

            resolve({ message: 'Уведомления отправлены', results });
        });
    });
}

/**
 * Фильтрует подписки по активным сессиям и правам доступа
 */
function filterSubscriptionsSession(rows: any[], filter: NotificationFilter): any[] {
    // Фильтруем по исключающим спискам
    const excludeSessionIds = new Set(filter.excludeSessionIds || []);
    const excludeUserIds = new Set(filter.excludeUserIds || []);
    const rules = filter.rules ? (Array.isArray(filter.rules) ? filter.rules : [filter.rules]) : [];

    return rows.filter((row: any) => {
        if (excludeSessionIds.has(row.session_id)) return false;
        if (excludeUserIds.has(row.user_id)) return false;
        if (rules.length && rules[0]) {
            return rules.includes(row.role);
        }
        return true;
    });
}

export default sendNotifications;
