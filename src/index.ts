import 'dotenv/config';
import Discord from 'discord.js';
import Events from './core/events.js';
import { create, Log } from './log.js';
Log.rotate();

const log = create('main');
log.info('starting up...');

import { loadCommands } from './core/command-handler.js';
import { loadModels } from './database/database.js';
import path from 'path';

await loadModels(path.join(path.dirname(new URL(import.meta.url).pathname), 'database', 'models'));
await loadCommands(path.join(path.dirname(new URL(import.meta.url).pathname), 'commands'));

const client = new Discord.Client({
    intents: ['Guilds', 'MessageContent', 'GuildMessages'],
    partials: [Discord.Partials.Message],
});

client.on('ready', (client) => {
    log.info(`logged in as @${client.user.username}`);
    log.info('ready to accept & run commands');
    Events.emit('botReady', client);
});

log.info('logging in...');
await client.login(process.env.DISCORD_TOKEN);
