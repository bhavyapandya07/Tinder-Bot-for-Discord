import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import db from '../database/database.js';
import { Gender, UserProfile } from '../database/models/user-profile.js';

export const data = new SlashCommandBuilder().setName('stats').setDescription('View statistics.');

export async function execute(int: ChatInputCommandInteraction) {
    const totalUsers = db.countWhere(UserProfile, {
        where: {
            clause: 'guildId = ?',
            values: [int.guildId!],
        },
    });

    const male = db.countWhere(UserProfile, {
        where: {
            clause: 'guildId = ? AND gender = ?',
            values: [int.guildId!, Gender.Male],
        },
    });

    const female = db.countWhere(UserProfile, {
        where: {
            clause: 'guildId = ? AND gender = ?',
            values: [int.guildId!, Gender.Female],
        },
    });

    const matched = db.countWhere(UserProfile, {
        where: {
            clause: 'guildId = ? AND matchedToUserId NOT NULL',
            values: [int.guildId!],
        },
    });

    const embed = new EmbedBuilder();
    embed.setColor('#38fe9b');
    embed.setTitle('Match Statistics');
    embed.addFields(
        {
            name: '👥 Total Users',
            value: `\`${totalUsers}\``,
        },
        {
            name: '♂️ Male',
            value: `\`${male}\` (${Math.round((male / totalUsers) * 100)}%)`,
        },
        {
            name: '♀️ Female',
            value: `\`${female}\` (${Math.round((female / totalUsers) * 100)}%)`,
        },
        {
            name: '❤️ Matched',
            value: `\`${matched}\` (${Math.round((matched / totalUsers) * 100)}%)`,
        }
    );

    await int.reply({
        embeds: [embed],
    });
}
