import { ActionRowBuilder, SelectMenuBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, ComponentType, SlashCommandBuilder } from 'discord.js';
import { getAnId } from '../util.js';
import db from '../database/database.js';
import { UserProfile } from '../database/models/user-profile.js';
import { interests } from '../constants.js';

// fixme make output the same

export const data = new SlashCommandBuilder().setName('interests').setDescription('Select your interests');

export async function execute(int: ChatInputCommandInteraction) {
    const row = new ActionRowBuilder();
    const menu = new SelectMenuBuilder()
        .setCustomId(getAnId())
        .setPlaceholder('Choose your interests')
        .setMinValues(1)
        .setMaxValues(interests.length)
        .setOptions(
            interests.map((i) => {
                return {
                    label: i[1],
                    value: i[1],
                    emoji: {
                        name: i[0],
                    },
                };
            })
        );

    row.addComponents(menu);

    const resp = await int.reply({
        components: [(row as ActionRowBuilder<SelectMenuBuilder>).toJSON()],
    });

    const menuResponse = await resp.awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        filter: (i) => i.user.id === int.user.id,
        idle: 60 * 1000,
    });

    const profile = db.findOneOptional(UserProfile, {
        where: {
            clause: 'userId = ? AND guildId = ?',
            values: [int.user.id, int.guildId],
        },
    });

    profile.guildId = int.guildId!;
    profile.userId = int.user.id;
    profile.interests = menuResponse.values;
    db.save(profile);

    await menuResponse.reply({
        content: 'Updated your interests.',
    });
}
