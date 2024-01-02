import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import db from '../database/database.js';
import { UserProfile } from '../database/models/user-profile.js';

// fixme: match output

export const data = new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your social media.')
    .addStringOption(
        new SlashCommandStringOption()
            .setName('url')
            .setDescription('Link to your social media.')
            .setMaxLength(300)
            .setMinLength(5)
            .setRequired(true)
    );

export async function execute(int: ChatInputCommandInteraction) {
    const link = int.options.getString('url', true);

    const profile = db.findOneOptional(UserProfile, {
        where: {
            clause: 'userId = ?',
            values: [int.user.id],
        },
    });

    profile.guildId = int.guildId!;
    profile.userId = int.user.id;
    profile.link = link;
    db.save(profile);

    await int.reply({
        content: 'Updated your social media.',
    });
}
