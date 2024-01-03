import { EmbedBuilder } from 'discord.js';
import { Gender } from './database/models/user-profile.js';
import { blacklistedSocialMediaDomains, whitelistedSocialMediaDomains } from './constants.js';

let id = 0;
export function getAnId() {
    return (id++).toString();
}

export function buildProfileEmbed(data: {
    gender: Gender;
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
            text: `Gender: ${data.gender}`,
        });

    return embed;
}

export function putAnS(str: string, num: number) {
    return num === 1 ? str : str + 's';
}

export function prettyPrintDuration(millis: number, longVersion = false) {
    if (millis.toString().includes('e')) return 'a very long time';
    millis = Math.round(millis);

    let years = 0,
        months = 0,
        days = 0,
        hours = 0,
        minutes = 0,
        seconds = Math.trunc(millis / 1000);

    if (seconds === 0) {
        return `${millis % 1000}ms`;
    }

    if (seconds >= 60) {
        minutes = (seconds - (seconds % 60)) / 60;
        seconds = seconds % 60;
    }

    if (minutes >= 60) {
        hours = (minutes - (minutes % 60)) / 60;
        minutes = minutes % 60;
    }

    if (hours >= 24) {
        days = (hours - (hours % 24)) / 24;
        hours = hours % 24;
    }

    if (days >= 30) {
        months = (days - (days % 30)) / 30;
        days = days % 30;
    }

    if (months >= 12) {
        years = (months - (months % 12)) / 12;
        months = months % 12;
    }

    if (!longVersion) {
        return `${years === 0 ? '' : `${years}y`}${months === 0 ? '' : `${months}m`}${
            days === 0 ? '' : `${days}d`
        }${hours === 0 ? '' : `${hours}h`}${minutes === 0 ? '' : `${minutes}m`}${
            seconds === 0 ? '' : `${seconds}s`
        }`;
    } else {
        return `${years === 0 ? '' : `${years} ${putAnS('year', years)} `}${
            months === 0 ? '' : `${months} ${putAnS('month', months)} `
        }${days === 0 ? '' : `${days} ${putAnS('day', days)} `}${
            hours === 0 ? '' : `${hours} ${putAnS('hour', hours)} `
        }${minutes === 0 ? '' : `${minutes} ${putAnS('min', minutes)} `}${
            seconds === 0 ? '' : `${seconds} ${putAnS('sec', seconds)} `
        }`.trim();
    }
}

export function validUrl(urlStr: string): boolean {
    if (urlStr.startsWith('<') && urlStr.endsWith('>')) {
        urlStr = urlStr.slice(1, -1);
    }

    try {
        const url = new URL(urlStr);
        if (url.protocol.toLowerCase() !== 'https:' && url.protocol.toLowerCase() !== 'http:') {
            return false;
        }

        if (blacklistedSocialMediaDomains.includes(url.hostname)) return false;
        if (
            whitelistedSocialMediaDomains.length > 0 &&
            !whitelistedSocialMediaDomains.includes(url.hostname)
        ) {
            return false;
        }

        return true;
    } catch (e) {
        return false;
    }
}
