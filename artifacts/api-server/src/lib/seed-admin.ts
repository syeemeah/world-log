import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * On startup: if no users exist AND ADMIN_PASSWORD is set,
 * create the initial "admin" account automatically.
 */
export async function seedAdminIfNeeded() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return;

  const existing = await db.select({ id: usersTable.id }).from(usersTable);
  if (existing.length > 0) return;

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.insert(usersTable).values({ username: "admin", passwordHash, role: "admin" });
  logger.info("Seeded initial admin account (username: admin)");
}
