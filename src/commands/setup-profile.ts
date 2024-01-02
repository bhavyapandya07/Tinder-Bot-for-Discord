import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ComponentType,
    Message,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
} from 'discord.js';
import db from '../database/database.js';
import { Gender, UserProfile } from '../database/models/user-profile.js';
import { getAnId } from '../util.js';
import { interests } from '../constants.js';

export const data = new SlashCommandBuilder().setName('setup-profile').setDescription('Setup your profile.');

export async function execute(int: ChatInputCommandInteraction) {
    let ans: Message | undefined = undefined;

    try {
        const profile = db.findOneOptional(UserProfile, {
            where: {
                clause: 'userId = ? AND guildId = ?',
                values: [int.user.id, int.guildId],
            },
        });

        profile.guildId = int.guildId!;
        profile.userId = int.user.id;

        {
            await int.reply(
                'Following questions will guide you on completing your profile.\nCan you tell us more about yourself?'
            );

            ans = (
                await int.channel!.awaitMessages({
                    filter: (m) => m.author.id == int.user.id,
                    time: 3 * 60 * 1000,
                    max: 1,
                    errors: ['time'],
                })
            ).first()!;
            profile.bio = ans.content.slice(0, 1000);
        }

        // fixme: validate links
        {
            await ans.reply({
                content: 'Can you please provide the links for your social media (It can be multiple links)',
            });

            ans = (
                await int.channel!.awaitMessages({
                    filter: (m) => m.author.id == int.user.id,
                    time: 3 * 60 * 1000,
                    max: 1,
                    errors: ['time'],
                })
            ).first()!;
            profile.link = ans.content.slice(0, 300);
        }

        {
            const row = new ActionRowBuilder();
            const menu = new StringSelectMenuBuilder()
                .setCustomId(getAnId())
                .setPlaceholder('What are your interests?')
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

            ans = await ans.reply({
                components: [(row as ActionRowBuilder<StringSelectMenuBuilder>).toJSON()],
            });

            const menuResponse = await ans.awaitMessageComponent({
                componentType: ComponentType.StringSelect,
                filter: (i) => i.user.id === int.user.id,
                time: 60 * 1000,
            });
            await menuResponse.deferUpdate();

            profile.interests = menuResponse.values;
        }

        {
            const row = new ActionRowBuilder();
            const menu = new StringSelectMenuBuilder()
                .setCustomId(getAnId())
                .setPlaceholder('What is your gender?')
                .setOptions(
                    {
                        label: 'Male',
                        value: 'male',
                    },
                    {
                        label: 'Female',
                        value: 'female',
                    }
                );

            row.addComponents(menu);

            ans = await ans.reply({
                components: [(row as ActionRowBuilder<StringSelectMenuBuilder>).toJSON()],
            });

            const menuResponse = await ans.awaitMessageComponent({
                componentType: ComponentType.StringSelect,
                filter: (i) => i.user.id === int.user.id,
                time: 60 * 1000,
            });

            await menuResponse.deferUpdate();
        }

        {
            const row = new ActionRowBuilder();
            const menu = new StringSelectMenuBuilder()
                .setCustomId(getAnId())
                .setPlaceholder('Which gender you want to get matched with?')
                .setOptions(
                    {
                        label: 'Male',
                        value: 'male',
                    },
                    {
                        label: 'Female',
                        value: 'female',
                    }
                );

            row.addComponents(menu);

            ans = await ans.reply({
                components: [(row as ActionRowBuilder<StringSelectMenuBuilder>).toJSON()],
            });

            const menuResponse = await ans.awaitMessageComponent({
                componentType: ComponentType.StringSelect,
                filter: (i) => i.user.id === int.user.id,
                time: 60 * 1000,
            });
            await menuResponse.deferUpdate();

            profile.matchingGender = menuResponse.values[0] as Gender;
        }

        profile.completedSetup = true;
        db.save(profile);

        ans.reply({
            content: 'You profile setup is complete, run `/start` to find a match.',
        });
    } catch (e) {
        if (e instanceof Error && e.message.includes('time')) {
            const content =
                'Answer the questions within a couple minutes, you can start the setup again through /setup-profile';
            if (!int.replied) {
                await int.reply({
                    content,
                });
            } else if (ans != null) {
                await ans.reply({
                    content,
                });
            } else {
                await int.channel!.send({
                    content: `<@${int.user.id}> ${content}`,
                });
            }
        }
    }
}
