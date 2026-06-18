import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const countryMemoriesTable = pgTable("country_memories", {
  id: serial("id").primaryKey(),
  countryCode: text("country_code").notNull().unique(),
  country: text("country").notNull(),
  bestMemory: text("best_memory"),
  bestPhotoBase64: text("best_photo_base64"),
  bestPhotoMime: text("best_photo_mime"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CountryMemory = typeof countryMemoriesTable.$inferSelect;
