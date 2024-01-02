import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import db from '../database/database.js';
import { UserProfile } from '../database/models/user-profile.js';
import { UserError } from '../errors.js';

export const data = new SlashCommandBuilder().setName('start').setDescription('Start looking for matches');

export async function execute(int: ChatInputCommandInteraction) {
    const profile = db.findOneOptional(UserProfile, {
        where: {
            clause: 'userId = ? AND guildId = ?',
            values: [int.user.id, int.guildId],
        },
    });

    if (profile.completedSetup) throw new UserError('Run `/setup-profile` to setup your profile first');

    db.save(profile);

    await int.reply({
        content: 'You will be matched with someone soon',
        ephemeral: true,
    });
}
