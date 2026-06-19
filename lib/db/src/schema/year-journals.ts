import { pgTable, serial, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const yearJournalsTable = pgTable("year_journals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  entryText: text("entry_text"),
  photoBase64: text("photo_base64"),
  photoMime: text("photo_mime"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("journals_user_year_unique").on(table.userId, table.year),
]);

export type YearJournal = typeof yearJournalsTable.$inferSelect;
