import { pgTable, serial, text, real, date, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).default(1),
  country: text("country").notNull(),
  countryCode: text("country_code").notNull(),
  city: text("city").notNull(),
  visitDate: date("visit_date").notNull(),
  notes: text("notes"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true, createdAt: true, userId: true });
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visitsTable.$inferSelect;
