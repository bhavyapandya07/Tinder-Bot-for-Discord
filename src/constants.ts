export const interests: [emoji: string, name: string][] = [
    ['✈️', 'Travel'],
    ['🎮', 'Gaming'],
    ['📖', 'Reading'],
    ['🏕️', 'Hiking'],
    ['💻', 'Programming'],
    ['🎨', 'Design'],
    ['🎸', 'Guitar'],
    ['🎹', 'Piano'],
];

// 7 days
export const coolDownPeriod = 7 * 24 * 60 * 60 * 1000;

/** Social media hostnames which are not allowed (empty to disable) */
export const blacklistedSocialMediaDomains: string[] = [];

/** Social media hostnames which are allowed (empty to disable) */
export const whitelistedSocialMediaDomains: string[] = [];
