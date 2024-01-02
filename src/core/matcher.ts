import { CronJob } from 'cron';
import { Events } from './events.js';

export function locateMatch(interests: string[]) {}

Events.on('botReady', () => {
    new CronJob('', async () => {}).start();
});
