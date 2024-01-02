import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import db from '../database/database.js';
import { UserProfile } from '../database/models/user-profile.js';
import { UserError } from '../errors.js';

export const disable = true;

export const data = new SlashCommandBuilder().setName('unmatch').setDescription('Remove your match');

export async function execute(int: ChatInputCommandInteraction) {
    const profile = db.findOneOptional(UserProfile, {
        where: {
            clause: 'userId = ? AND guildId = ?',
            values: [int.user.id, int.guildId],
        },
    });

    if (profile.matchedToUserId == null) throw new UserError('You have not been matched with anyone');

    profile.matchedTo = -1;
    profile.matchedToUserId = null;
    db.save(profile);

    await int.reply({
        content:
            'Your match has been removed, to disable further matches run `/stop` if you have not done already.',
        ephemeral: true,
    });
}
