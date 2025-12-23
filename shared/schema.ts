import { z } from "zod";

export const spellSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  school: z.string(),
  classes: z.array(z.string()),
  castingTime: z.string(),
  range: z.string(),
  components: z.string(),
  duration: z.string(),
  description: z.string(),
  edition: z.enum(["2014", "2024"]),
  custom: z.boolean().default(false),
  favorite: z.boolean().default(false),
  lastUsed: z.number().optional(),
});

export const spellbookSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  spells: z.array(z.string()), // spell ids
  preparedSpells: z.array(z.string()).default([]),
});

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Spell = z.infer<typeof spellSchema>;
export type Spellbook = z.infer<typeof spellbookSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
