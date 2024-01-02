import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CategoryChannel,
    ChatInputCommandInteraction,
    ComponentType,
    OverwriteType,
    SlashCommandBuilder,
} from 'discord.js';
import db from '../database/database.js';
import { Gender, UserProfile } from '../database/models/user-profile.js';
import { UserError } from '../errors.js';
import { buildProfileEmbed } from '../util.js';
import { coolDownPeriod } from '../constants.js';
import { GuildSettings } from '../database/models/guild-settings.js';

export const data = new SlashCommandBuilder().setName('start').setDescription('Start looking for matches');

export async function execute(int: ChatInputCommandInteraction) {
    const settings = await db.findOneOptional(GuildSettings, {
        where: {
            clause: 'guildId = ?',
            values: [int.guildId],
        },
    });

    if (settings.matchCategoryChannelId.length === 0 || settings._new) {
        throw new UserError('Run `/setup` to setup the matched user category first');
    }
    const parent = (await int.guild!.channels.fetch(settings.matchCategoryChannelId))! as CategoryChannel;

    const profile = db.findOneOptional(UserProfile, {
        where: {
            clause: 'userId = ? AND guildId = ?',
            values: [int.user.id, int.guildId],
        },
    });

    if (!profile.completedSetup) throw new UserError('Run `/setup-profile` to setup your profile first');
    if (profile.matchCooldownExpires > Date.now())
        throw new UserError('Take your time to get to know your match first!');

    const reply = await int.reply({
        content: 'Finding potential matches...',
    });

    const matches = db.db
        .prepare(
            `
        SELECT id, interests, gender, bio, link, userId, (
                SELECT json_group_array(value) FROM json_each(interests)
                WHERE value IN (select value FROM json_each(?))
            ) AS matchingInterests
        FROM 
            Userprofile
        WHERE 
            guildId = ? AND NOT id = ? AND completedSetup = 1 AND matchedToUserId IS NULL AND gender = ?
        ORDER BY 
            json_array_length(matchingInterests) DESC
    `
        )
        .all(JSON.stringify(profile.interests), profile.guildId, profile.id, profile.matchingGender) as {
        id: number;
        interests: string;
        matchingInterests: string[];
        gender: Gender;
        bio: string | null;
        link: string | null;
        userId: string;
    }[];

    if (matches.length === 0) {
        await reply.edit({
            content: 'Unable to find matches :(',
        });
        return;
    }

    let btnInt;
    let i = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (i >= matches.length) i = 0;
        const match = matches[i];

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('yes').setLabel('Yes').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('no').setLabel('No').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        );

        const user = await int.client.users.fetch(match.userId);

        const embed = buildProfileEmbed({
            ...match,
            username: user.username,
            avatarUrl: user.displayAvatarURL(),
            interests: JSON.parse(match.interests),
        });

        const data = {
            content: 'Is this a good match?',
            embeds: [embed],
            components: [row.toJSON()],
        };

        let resp;
        if (btnInt == null) {
            resp = await reply.edit(data);
        } else {
            resp = await btnInt.update(data);
        }

        btnInt = await resp.awaitMessageComponent({
            componentType: ComponentType.Button,
            filter: (u) => u.user.id === int.user.id,
            time: 3 * 60 * 1000,
        });

        if (btnInt.customId === 'yes') {
            const matchProfile = await db.findOne(UserProfile, match.id);
            matchProfile.matchedTo = profile.id;
            matchProfile.matchedToUserId = profile.userId;
            matchProfile.matchCooldownExpires = Date.now() + coolDownPeriod;

            profile.matchedTo = match.id;
            profile.matchedToUserId = match.userId;
            profile.matchCooldownExpires = Date.now() + coolDownPeriod;

            // fixme convert cooldown to time instead of hard code
            await btnInt.update({
                content: `You were matched with <@${match.userId}>, you will not be able to use the \`/start\` command for 7 days`,
                components: [],
            });

            const matchChannel = await int.guild!.channels.create({
                name: `match-${profile.id}-${matchProfile.id}`,
                parent: parent.id,
                permissionOverwrites: [
                    ...parent.permissionOverwrites.cache.values(),
                    {
                        id: profile.userId,
                        type: OverwriteType.Member,
                        allow: [
                            'SendMessages',
                            'AddReactions',
                            'ReadMessageHistory',
                            'AttachFiles',
                            'ViewChannel',
                            'UseExternalEmojis',
                            'UseExternalStickers',
                        ],
                        deny: ['CreateInstantInvite'],
                    },
                    {
                        id: matchProfile.userId,
                        type: OverwriteType.Member,
                        allow: [
                            'SendMessages',
                            'AddReactions',
                            'ReadMessageHistory',
                            'AttachFiles',
                            'ViewChannel',
                            'UseExternalEmojis',
                            'UseExternalStickers',
                        ],
                        deny: ['CreateInstantInvite'],
                    },
                ],
            });

            matchProfile.matchChannelId = matchChannel.id;
            profile.matchChannelId = matchChannel.id;

            db.save(matchProfile);
            db.save(profile);
            break;
        }

        if (btnInt.customId === 'cancel') {
            await btnInt.update({
                content: 'Match finding was cancelled. Use `/start` to start the process again.',
            });
        }

        i++;
    }
}
