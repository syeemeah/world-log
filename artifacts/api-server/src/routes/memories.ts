import { Router } from "express";
import { db, countryMemoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/memories", async (_req, res) => {
  const rows = await db.select().from(countryMemoriesTable);
  res.json(rows.map(fmt));
});

router.get("/memories/:countryCode", async (req, res) => {
  const [row] = await db
    .select()
    .from(countryMemoriesTable)
    .where(eq(countryMemoriesTable.countryCode, req.params.countryCode.toUpperCase()));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.put("/memories/:countryCode", async (req, res) => {
  const code = req.params.countryCode.toUpperCase();
  const { bestMemory, bestPhotoBase64, bestPhotoMime, country } = req.body as {
    bestMemory?: string | null;
    bestPhotoBase64?: string | null;
    bestPhotoMime?: string | null;
    country?: string;
  };

  // Resolve country name from existing visits if not provided
  let countryName = country ?? "";
  if (!countryName) {
    const { visitsTable } = await import("@workspace/db");
    const [visit] = await db
      .select({ country: visitsTable.country })
      .from(visitsTable)
      .where(eq(visitsTable.countryCode, code))
      .limit(1);
    countryName = visit?.country ?? code;
  }

  const [row] = await db
    .insert(countryMemoriesTable)
    .values({
      countryCode: code,
      country: countryName,
      bestMemory: bestMemory ?? null,
      bestPhotoBase64: bestPhotoBase64 ?? null,
      bestPhotoMime: bestPhotoMime ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: countryMemoriesTable.countryCode,
      set: {
        bestMemory: bestMemory ?? null,
        bestPhotoBase64: bestPhotoBase64 ?? null,
        bestPhotoMime: bestPhotoMime ?? null,
        updatedAt: new Date(),
        ...(countryName ? { country: countryName } : {}),
      },
    })
    .returning();

  res.json(fmt(row));
});

router.delete("/memories/:countryCode", async (req, res) => {
  const [deleted] = await db
    .delete(countryMemoriesTable)
    .where(eq(countryMemoriesTable.countryCode, req.params.countryCode.toUpperCase()))
    .returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});

function fmt(r: typeof countryMemoriesTable.$inferSelect) {
  return {
    id: r.id,
    countryCode: r.countryCode,
    country: r.country,
    bestMemory: r.bestMemory ?? null,
    bestPhotoBase64: r.bestPhotoBase64 ?? null,
    bestPhotoMime: r.bestPhotoMime ?? null,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
  };
}

export default router;
