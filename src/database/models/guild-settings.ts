import { BaseModel, orm } from '../database.js';

@orm.model()
export class GuildSettings extends BaseModel {
    matchCategoryChannelId = '';
}
