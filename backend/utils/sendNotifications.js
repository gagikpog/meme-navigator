const db = require("../db/database");
const webpush = require("web-push");

function sendNotifications(data) {

    const payload = JSON.stringify(data);

    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM subscriptions", async (err, rows) => {
            if (err) {
                console.error("Ошибка чтения подписок:", err);
                return reject("Ошибка базы данных");
            }

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

module.exports = sendNotifications;
