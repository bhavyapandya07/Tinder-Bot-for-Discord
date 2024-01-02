import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import db from '../database/database.js';
import { UserProfile } from '../database/models/user-profile.js';

export const data = new SlashCommandBuilder()
    .setName('bio')
    .setDescription('Link your social media.')
    .addStringOption(new SlashCommandStringOption().setName('url').setMaxLength(300).setMinLength(5));

export async function execute(int: ChatInputCommandInteraction) {
    const link = int.options.getString('url', true);

    const profile = db.findOneOptional(UserProfile, {
        where: {
            clause: 'userId = ?',
            values: [int.user.id],
        },
    });

    profile.guildId = int.guildId!;
    profile.link = link;
    db.save(profile);

    await int.reply({
        content: 'Updated your social media.',
    });
}
