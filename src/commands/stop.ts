import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import db from '../database/database.js';
import { UserProfile } from '../database/models/user-profile.js';

export const data = new SlashCommandBuilder().setName('start').setDescription('Start looking for matches');

export async function execute(int: ChatInputCommandInteraction) {
    const profile = db.findOneOptional(UserProfile, {
        where: {
            clause: 'userId = ? AND guildId = ?',
            values: [int.user.id, int.guildId],
        },
    });

    profile.isMatching = false;
    db.save(profile);

    if (profile.matchedToUserId != null) {
        await int.reply({
            content: 'You will not be matched anymore, use `/unmatch` to remove existing match',
            ephemeral: true,
        });
    }

    await int.reply({
        content: 'You will not be matched anymore',
        ephemeral: true,
    });
}
