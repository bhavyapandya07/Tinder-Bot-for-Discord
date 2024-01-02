import { EmbedBuilder } from 'discord.js';
import { Gender } from './database/models/user-profile.js';

let id = 0;
export function getAnId() {
    return (id++).toString();
}

export function buildProfileEmbed(data: {
    gender: Gender;
    otherGenderDetail: string | null;
    username: string;
    avatarUrl: string;
    link: string | null;
    bio: string | null;
    interests: string[];
}): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setTitle(`${data.username}'s Profile`)
        .setThumbnail(data.avatarUrl)
        .setColor('#34c9eb')
        .addFields(
            {
                name: '✨ Link',
                value: data.link ?? '*Not set*',
            },
            {
                name: '💬 Bio',
                value: data.bio ?? '*Not set*',
            },
            {
                name: '🪀 Interests',
                value: data.interests.length === 0 ? '*Not set*' : data.interests.join(', '),
            }
        )
        .setFooter({
            text: `Gender: ${data.gender === Gender.Other ? data.otherGenderDetail ?? 'other' : data.gender}`,
        });

    return embed;
}
