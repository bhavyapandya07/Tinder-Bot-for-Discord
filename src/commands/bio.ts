import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import db from '../database/database.js';
import { UserProfile } from '../database/models/user-profile.js';

export const data = new SlashCommandBuilder()
    .setName('bio')
    .setDescription('Tell us something about yourself.')
    .addStringOption(
        new SlashCommandStringOption()
            .setName('aboutme')
            .setDescription('Something about you.')
            .setMaxLength(1000)
            .setMinLength(3)
            .setRequired(true)
    );

export async function execute(int: ChatInputCommandInteraction) {
    const aboutMe = int.options.getString('aboutme', true);

    const profile = db.findOneOptional(UserProfile, {
        where: {
            clause: 'userId = ? AND guildId = ?',
            values: [int.user.id, int.guildId],
        },
    });

    profile.guildId = int.guildId!;
    profile.userId = int.user.id;
    profile.bio = aboutMe;
    db.save(profile);

    await int.reply({
        content: 'Updated your bio.',
    });
}
