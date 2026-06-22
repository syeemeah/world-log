import { pgTable, serial, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const countryMemoriesTable = pgTable("country_memories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  countryCode: text("country_code").notNull(),
  country: text("country").notNull(),
  bestMemory: text("best_memory"),
  bestPhotoBase64: text("best_photo_base64"),
  bestPhotoMime: text("best_photo_mime"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("memories_user_country_unique").on(table.userId, table.countryCode),
]);

export type CountryMemory = typeof countryMemoriesTable.$inferSelect;
