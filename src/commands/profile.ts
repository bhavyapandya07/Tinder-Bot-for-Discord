import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import db from '../database/database.js';
import { UserProfile } from '../database/models/user-profile.js';
import { buildProfileEmbed } from '../util.js';

export const data = new SlashCommandBuilder().setName('profile').setDescription('See your profile.');

// fixme: match output

export async function execute(int: ChatInputCommandInteraction) {
    const profile = db.findOneOptional(UserProfile, {
        where: {
            clause: 'userId = ? AND guildId = ?',
            values: [int.user.id, int.guildId],
        },
    });

    profile.guildId = int.guildId!;
    profile.userId = int.user.id;
    if (profile._new) db.save(profile);

    const embed = buildProfileEmbed({
        ...profile,
        username: int.user.username,
        avatarUrl: int.user.displayAvatarURL(),
    });

    await int.reply({
        embeds: [embed],
    });
}
