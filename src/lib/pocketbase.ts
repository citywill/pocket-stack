import PocketBase from 'pocketbase';

const pbUrl = import.meta.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
export const pb = new PocketBase(pbUrl);
