import { SlashCommandBuilder, ChatInputCommandInteraction, Client, DiscordAPIError } from 'discord.js';
import Discord from 'discord.js';
import path from 'path';
import fs from 'fs';
import Events from './events.js';
import { create } from '../log.js';
import { UserError } from '../errors.js';
const log = create('command-handler');

const commands: Map<
    string,
    {
        data: SlashCommandBuilder;
        execute: (interaction: ChatInputCommandInteraction) => Awaitable<void>;
    }
> = new Map();

export async function loadCommands(dir: string) {
    log.info('loading commands...');
    const commandFiles = fs.readdirSync(dir);
    for (const file of commandFiles) {
        const commandData = await import(path.join(dir, file));

        if ('disable' in commandData) continue;

        if (!('data' in commandData) || !('execute' in commandData)) {
            throw new Error(`error loading command file '${file}', missing command data & execute exports`);
        }

        commands.set(commandData.data.name, commandData);
        log.info('loaded', commandData.data.name);
    }
}

async function registerCommands(client: Client<true>) {
    log.info('sending commands to discord...');

    for (const guildId of client.guilds.cache.keys()) {
        await client.rest.put(Discord.Routes.applicationGuildCommands(client.application.id, guildId), {
            body: [...commands.values()].map((c) => c.data.toJSON()),
        });
        log.info('updated commands for guild', guildId);
    }

    log.info('slash commands updated');
}

Events.on('botReady', async (client) => {
    if (process.argv.includes('--reload-commands') || process.env.AUTO_RELOAD_COMMANDS) {
        log.info('reloading commands...');
        await registerCommands(client);
        if (process.argv.includes('--reload-commands')) process.exit(0);
    } else {
        log.info('not reloading commands');
    }

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = commands.get(interaction.commandName);

        if (command == null) {
            log.warn(`received a command ${interaction.commandName} but the command was never registered`);
            return;
        }

        try {
            log.info(`running command /${interaction.commandName} from @${interaction.user.username}`);
            await command.execute(interaction);
        } catch (e) {
            let msg = 'Something went wrong, please contact maintainers, with what you did to get here';

            // missing perm code
            if (e instanceof DiscordAPIError && e.code.toString() === '50013') {
                msg = 'Missing permissions';
            }

            if (e instanceof UserError) {
                msg = e.message;
            } else {
                log.error('something went wrong while running slash command', interaction.commandName);
                log.error(e);
            }
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: msg,
                        fetchReply: false,
                    });
                } else {
                    await interaction.reply({
                        content: msg,
                        ephemeral: true,
                        fetchReply: false,
                    });
                }
            } catch (e) {
                log.error('something went wrong while running slash command', interaction.commandName);
                log.error(e);
            }
        }
        log.info(`finished running command /${interaction.commandName} from @${interaction.user.username}`);
    });
});
