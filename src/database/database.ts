import { SqlTable, SqliteOrm } from 'node-sqlite-orm-2';
import { create } from '../log.js';
import path from 'path';
import fs from 'fs';
const log = create('database');

export class BaseModel extends SqlTable {
    public guildId = '';
}

export const orm = new SqliteOrm({
    dbPath: './guild-data.db',
    backupDir: './backup',
    backupInterval: 3 * 24 * 60 * 60 * 1000,
});

export default orm;

export async function loadModels(dir: string) {
    log.info('loading models...');
    for (const model of fs.readdirSync(dir)) {
        await import(path.join(dir, model));
        log.info('loaded model', model);
    }
    orm.modelsLoaded();
}
