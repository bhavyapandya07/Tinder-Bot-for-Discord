import {
    ChannelType,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandChannelOption,
} from 'discord.js';
import db from '../database/database.js';
import { GuildSettings } from '../database/models/guild-settings.js';

export const data = new SlashCommandBuilder()
    .setName('setup')
    .addChannelOption(
        new SlashCommandChannelOption()
            .setName('channel')
            .setRequired(true)
            .setDescription('Channel under which matched member channels will go')
            .addChannelTypes(ChannelType.GuildCategory)
    );

export async function execute(int: ChatInputCommandInteraction) {
    const channel = int.options.getChannel('channel', true);

    const settings = db.findOneOptional(GuildSettings, {
        where: {
            clause: 'guildId = ?',
            values: [int.guildId],
        },
    });

    settings.matchCategoryChannelId = channel.id;
    db.save(settings);

    await int.reply({
        content: 'Settings updated.',
    });
}
