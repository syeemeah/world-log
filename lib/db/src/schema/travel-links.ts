import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const travelLinksTable = pgTable("travel_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  type: text("type", { enum: ["blog", "photos", "other"] }).notNull().default("blog"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TravelLink = typeof travelLinksTable.$inferSelect;
