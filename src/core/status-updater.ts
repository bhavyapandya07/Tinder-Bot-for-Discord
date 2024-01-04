import { ActivityType, Client } from 'discord.js';
import { Events } from './events.js';
import { UserProfile } from '../database/models/user-profile.js';
import db from '../database/database.js';

function updateStatus(client: Client<true>) {
    const matched = db.countWhere(UserProfile, {
        where: {
            clause: 'matchedToUserId NOT NULL',
        },
    });

    client.user.setActivity({
        name: `Matched ${matched} users so far`,
        type: ActivityType.Custom,
    });
}

Events.on('botReady', (client) => {
    updateStatus(client);
});

Events.on('profileMatched', (client) => {
    updateStatus(client);
});

Events.on('profileUnMatched', (client) => {
    updateStatus(client);
});
