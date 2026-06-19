import { Router, type Request, type Response } from "express";
import { db, yearJournalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "./auth";

const router = Router();

router.get("/journal", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).authUser.id;
  const rows = await db.select().from(yearJournalsTable)
    .where(eq(yearJournalsTable.userId, userId));
  res.json(rows.map(fmt));
});

router.put("/journal/:year", requireAuth, async (req: Request, res: Response) => {
  const year = Number(req.params["year"]);
  if (!year || isNaN(year)) { res.status(400).json({ error: "Valid year required" }); return; }
  const { entryText, photoBase64, photoMime } = req.body as {
    entryText?: string | null; photoBase64?: string | null; photoMime?: string | null;
  };
  const userId = (req as AuthRequest).authUser.id;

  const [row] = await db.insert(yearJournalsTable)
    .values({ userId, year, entryText: entryText ?? null, photoBase64: photoBase64 ?? null, photoMime: photoMime ?? null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [yearJournalsTable.userId, yearJournalsTable.year],
      set: { entryText: entryText ?? null, photoBase64: photoBase64 ?? null, photoMime: photoMime ?? null, updatedAt: new Date() },
    })
    .returning();
  res.json(fmt(row));
});

router.delete("/journal/:year", requireAuth, async (req: Request, res: Response) => {
  const year = Number(req.params["year"]);
  const userId = (req as AuthRequest).authUser.id;
  await db.delete(yearJournalsTable)
    .where(and(eq(yearJournalsTable.userId, userId), eq(yearJournalsTable.year, year)));
  res.status(204).send();
});

function fmt(r: typeof yearJournalsTable.$inferSelect) {
  return {
    id: r.id,
    year: r.year,
    entryText: r.entryText ?? null,
    photoBase64: r.photoBase64 ?? null,
    photoMime: r.photoMime ?? null,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
  };
}

export default router;
