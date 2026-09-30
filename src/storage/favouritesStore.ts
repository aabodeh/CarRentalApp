import { isStringArray } from '../types/guards';
import { readJson, writeJson } from './keyValueStore';

/**
 * The ids of the cars saved on this phone, oldest first. Key: `carrental.v2.favourites`.
 *
 * A plain `string[]`, not an entity: a favourite has nothing of its own beyond which car it is.
 */
export const favouritesStore = {
  async read(): Promise<string[]> {
    const stored = await readJson('favourites', isStringArray);
    return stored ? stored.data : [];
  },

  write(carIds: string[]): Promise<void> {
    return writeJson('favourites', carIds);
  },
};
