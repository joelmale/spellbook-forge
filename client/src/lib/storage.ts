import Dexie, { Table } from 'dexie';
import { Spell, Spellbook, UserProfile } from '@shared/schema';

export class SpellbookDB extends Dexie {
  spells!: Table<Spell>;
  spellbooks!: Table<Spellbook>;
  profiles!: Table<UserProfile>;

  constructor() {
    super('SpellbookDB');
    this.version(1).stores({
      spells: 'id, name, level, school, classes, edition, custom',
      spellbooks: 'id, name, spells',
      profiles: 'id, name',
    });
    this.version(2).stores({
      spells: 'id, name, level, school, classes, edition, custom, favorite, lastUsed',
      spellbooks: 'id, name, spells',
      profiles: 'id, name',
    }).upgrade(async (tx) => {
      await tx.table('spells').toCollection().modify((spell) => {
        if (spell.favorite === undefined) {
          spell.favorite = false;
        }
        if (spell.lastUsed === undefined) {
          spell.lastUsed = 0;
        }
      });
    });
  }
}

const db = new SpellbookDB();

const LAST_UPDATED_KEY = 'spellbook-last-updated';

const touchLastUpdated = () => {
  const timestamp = Date.now();
  localStorage.setItem(LAST_UPDATED_KEY, String(timestamp));
  window.dispatchEvent(new CustomEvent(LAST_UPDATED_KEY, { detail: timestamp }));
};

const getLastUpdated = () => {
  const value = localStorage.getItem(LAST_UPDATED_KEY);
  return value ? Number(value) : null;
};

export const storage = {
  getLastUpdated,
  // Spells
  async getSpells(): Promise<Spell[]> {
    return await db.spells.toArray();
  },

  async addSpell(spell: Spell): Promise<void> {
    await db.spells.add(spell);
    touchLastUpdated();
  },

  async updateSpell(spell: Spell): Promise<void> {
    await db.spells.put(spell);
    touchLastUpdated();
  },

  async deleteSpell(id: string): Promise<void> {
    await db.spells.delete(id);
    touchLastUpdated();
  },

  // Spellbooks
  async getSpellbooks(): Promise<Spellbook[]> {
    return await db.spellbooks.toArray();
  },

  async addSpellbook(spellbook: Spellbook): Promise<void> {
    await db.spellbooks.add(spellbook);
    touchLastUpdated();
  },

  async updateSpellbook(spellbook: Spellbook): Promise<void> {
    await db.spellbooks.put(spellbook);
    touchLastUpdated();
  },

  async deleteSpellbook(id: string): Promise<void> {
    await db.spellbooks.delete(id);
    touchLastUpdated();
  },

  // Profiles
  async getProfiles(): Promise<UserProfile[]> {
    return await db.profiles.toArray();
  },

  async addProfile(profile: UserProfile): Promise<void> {
    await db.profiles.add(profile);
    touchLastUpdated();
  },

  async updateProfile(profile: UserProfile): Promise<void> {
    await db.profiles.put(profile);
    touchLastUpdated();
  },

  async deleteProfile(id: string): Promise<void> {
    await db.profiles.delete(id);
    touchLastUpdated();
  },

  // Export/Import
  async exportData(): Promise<string> {
    const spells = await db.spells.filter(s => s.custom).toArray();
    const spellbooks = await db.spellbooks.toArray();
    const profiles = await db.profiles.toArray();
    return JSON.stringify({ spells, spellbooks, profiles }, null, 2);
  },

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      if (data.spells) {
        const incomingSpells = data.spells.map((spell: Spell) => ({
          ...spell,
          favorite: spell.favorite ?? false,
          lastUsed: spell.lastUsed ?? 0,
          custom: spell.custom ?? false,
        }));
        await db.spells.bulkAdd(incomingSpells);
      }
      if (data.spellbooks) {
        await db.spellbooks.bulkAdd(data.spellbooks);
      }
      if (data.profiles) {
        await db.profiles.bulkAdd(data.profiles);
      }
      touchLastUpdated();
    } catch {
      throw new Error('Invalid JSON data');
    }
  },

  // Load predefined spells
  async loadPredefinedSpells(): Promise<void> {
    const response2014 = await fetch('/spells-2014.json');
    const spells2014: Spell[] = await response2014.json();
    const response2024 = await fetch('/spells-2024.json');
    const spells2024: Spell[] = await response2024.json();
    const allSpells = [...spells2014, ...spells2024].map((spell) => ({
      ...spell,
      favorite: spell.favorite ?? false,
      lastUsed: spell.lastUsed ?? 0,
      custom: spell.custom ?? false,
    }));

    const existingSpells = await db.spells.toArray();
    const existingMap = new Map(existingSpells.map(spell => [spell.id, spell]));
    const mergedSpells = allSpells.map((spell) => {
      const existing = existingMap.get(spell.id);
      return {
        ...spell,
        favorite: existing?.favorite ?? spell.favorite ?? false,
        lastUsed: existing?.lastUsed ?? spell.lastUsed ?? 0,
        custom: false,
      };
    });
    await db.spells.bulkPut(mergedSpells);
  },
};
