import { Router, type Request, type Response } from "express";
import { db, countryMemoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "./auth";

const router = Router();

router.get("/memories", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).authUser.id;
  const rows = await db.select().from(countryMemoriesTable).where(eq(countryMemoriesTable.userId, userId));
  res.json(rows.map(fmt));
});

router.get("/memories/:countryCode", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).authUser.id;
  const code = String(req.params.countryCode).toUpperCase();
  const [row] = await db
    .select()
    .from(countryMemoriesTable)
    .where(and(
      eq(countryMemoriesTable.userId, userId),
      eq(countryMemoriesTable.countryCode, code)
    ));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.put("/memories/:countryCode", requireAuth, async (req: Request, res: Response) => {
  const code = String(req.params.countryCode).toUpperCase();
  const userId = (req as AuthRequest).authUser.id;
  const { bestMemory, bestPhotoBase64, bestPhotoMime, country } = req.body as {
    bestMemory?: string | null;
    bestPhotoBase64?: string | null;
    bestPhotoMime?: string | null;
    country?: string;
  };

  let countryName = country ?? "";
  if (!countryName) {
    const { visitsTable } = await import("@workspace/db");
    const [visit] = await db
      .select({ country: visitsTable.country })
      .from(visitsTable)
      .where(and(eq(visitsTable.userId, userId), eq(visitsTable.countryCode, code)))
      .limit(1);
    countryName = visit?.country ?? code;
  }

  const [row] = await db
    .insert(countryMemoriesTable)
    .values({
      userId,
      countryCode: code,
      country: countryName,
      bestMemory: bestMemory ?? null,
      bestPhotoBase64: bestPhotoBase64 ?? null,
      bestPhotoMime: bestPhotoMime ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [countryMemoriesTable.userId, countryMemoriesTable.countryCode],
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

router.delete("/memories/:countryCode", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).authUser.id;
  const code = String(req.params.countryCode).toUpperCase();
  const [deleted] = await db
    .delete(countryMemoriesTable)
    .where(and(
      eq(countryMemoriesTable.userId, userId),
      eq(countryMemoriesTable.countryCode, code)
    ))
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
