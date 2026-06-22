import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const bucketListTable = pgTable("bucket_list_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  country: text("country"),
  countryCode: text("country_code"),
  city: text("city"),
  notes: text("notes"),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  targetYear: integer("target_year"),
  achieved: boolean("achieved").notNull().default(false),
  achievedAt: timestamp("achieved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BucketListItem = typeof bucketListTable.$inferSelect;
