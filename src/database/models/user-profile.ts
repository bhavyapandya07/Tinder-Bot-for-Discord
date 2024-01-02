import { BaseModel, orm } from '../database.js';

@orm.model()
export class UserProfile extends BaseModel {
    userId = '';

    @orm.columnType('string')
    bio: string | null = null;

    @orm.columnType('string')
    link: string | null = null;

    interests: string[] = [];

    /** Another profile Id */
    matchedTo: number = -1;

    @orm.columnType('string')
    matchedToUserId: string | null = null;

    isMatching = false;
}
