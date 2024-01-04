import { Routes } from 'discord.js';
// import { CronJob } from 'cron';
import { Events } from './events.js';
import db from '../database/database.js';

Events.on('botReady', async (client) => {
    // new CronJob('0 */3 * * *', async () => {
    // to avoid accidentally deleting something else to awaits
    const now = Date.now();

    // -- to be notified --

    const toNotifyDelete = db.db
        .prepare(
            `
            SELECT DISTINCT
                matchChannelId
            FROM
                UserProfile
            WHERE
                matchCooldownExpires < ? AND matchCooldownExpires > ? AND matchChannelId NOT NULL
                `
        )
        .all(now + 24 * 60 * 60 * 1000, now) as { matchChannelId: string }[];

    for (const item of toNotifyDelete) {
        await client.rest.post(Routes.channelMessages(item.matchChannelId), {
            body: {
                content:
                    'This channel will be deleted soon after your cooldowns expire.\nYour match status will remain unchanged unless you run `/start`',
            },
        });
    }

    // -- to be deleted --

    const toDelete = db.db
        .prepare(
            `
            SELECT DISTINCT
                matchChannelId
            FROM
                UserProfile
            WHERE
                matchCooldownExpires < ? AND matchChannelId NOT NULL
                `
        )
        .all(now) as { matchChannelId: string }[];

    for (const item of toDelete) {
        await client.rest.delete(Routes.channel(item.matchChannelId));
    }

    db.db
        .prepare(
            `
            UPDATE 
                UserProfile
            SET
                matchChannelId = NULL
            WHERE
                matchCooldownExpires < ? AND matchChannelId NOT NULL
                `
        )
        .run(now);
    // }).start();
});
