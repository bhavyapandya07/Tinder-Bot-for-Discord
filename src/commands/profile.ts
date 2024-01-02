import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import db from '../database/database.js';
import { UserProfile } from '../database/models/user-profile.js';

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

    const embed = new EmbedBuilder()
        .setTitle(`${int.user.username}'s Profile`)
        .setThumbnail(int.user.displayAvatarURL())
        .setColor('#4444ee')
        .addFields(
            {
                name: '✨ Link',
                value: profile.link ?? '*Not set*',
            },
            {
                name: '💬 Bio',
                value: profile.bio ?? '*Not set*',
            },
            {
                name: '🪀 Interests',
                value: profile.interests.length === 0 ? '*Not set*' : profile.interests.join(', '),
            }
        );

    await int.reply({
        embeds: [embed],
    });
}
