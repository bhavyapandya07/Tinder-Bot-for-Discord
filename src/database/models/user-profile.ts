import { BaseModel, orm } from '../database.js';

export enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other',
}

@orm.model()
export class UserProfile extends BaseModel {
    userId = '';

    completedSetup = false;

    @orm.columnType('string')
    gender!: Gender;
    @orm.columnType('string')
    otherGenderDetail: string | null = null;

    @orm.columnType('string')
    matchingGender!: Gender;

    @orm.columnType('string')
    bio: string | null = null;

    @orm.columnType('string')
    link: string | null = null;

    interests: string[] = [];

    /** Another profile Id */
    matchedTo: number = -1;

    @orm.columnType('string')
    matchedToUserId: string | null = null;

    matchCooldownExpires = 0;
}
