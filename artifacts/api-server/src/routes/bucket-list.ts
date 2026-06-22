import { Router, type Request, type Response } from "express";
import { db, bucketListTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  CreateBucketListItemBody,
  UpdateBucketListItemParams,
  UpdateBucketListItemBody,
  DeleteBucketListItemParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "./auth";

const router = Router();

router.get("/bucket-list", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).authUser.id;
  const rows = await db
    .select()
    .from(bucketListTable)
    .where(eq(bucketListTable.userId, userId))
    .orderBy(desc(bucketListTable.createdAt));
  res.json(rows.map(fmt));
});

router.post("/bucket-list", requireAuth, async (req: Request, res: Response) => {
  const parsed = CreateBucketListItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const userId = (req as AuthRequest).authUser.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [row] = await db.insert(bucketListTable).values({ ...parsed.data, userId } as any).returning();
  res.status(201).json(fmt(row));
});

router.patch("/bucket-list/:id", requireAuth, async (req: Request, res: Response) => {
  const paramsParsed = UpdateBucketListItemParams.safeParse({ id: Number(req.params["id"]) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateBucketListItemBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }
  const userId = (req as AuthRequest).authUser.id;

  const updates: Record<string, unknown> = { ...bodyParsed.data };
  if (typeof bodyParsed.data.achieved === "boolean") {
    updates["achievedAt"] = bodyParsed.data.achieved ? new Date() : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [row] = await db.update(bucketListTable).set(updates as any).where(
    and(eq(bucketListTable.id, paramsParsed.data.id), eq(bucketListTable.userId, userId))
  ).returning();
  if (!row) { res.status(404).json({ error: "Goal not found" }); return; }
  res.json(fmt(row));
});

router.delete("/bucket-list/:id", requireAuth, async (req: Request, res: Response) => {
  const parsed = DeleteBucketListItemParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const userId = (req as AuthRequest).authUser.id;
  const [deleted] = await db.delete(bucketListTable).where(
    and(eq(bucketListTable.id, parsed.data.id), eq(bucketListTable.userId, userId))
  ).returning();
  if (!deleted) { res.status(404).json({ error: "Goal not found" }); return; }
  res.status(204).send();
});

function fmt(r: typeof bucketListTable.$inferSelect) {
  return {
    id: r.id,
    title: r.title,
    country: r.country ?? null,
    countryCode: r.countryCode ?? null,
    city: r.city ?? null,
    notes: r.notes ?? null,
    priority: r.priority,
    targetYear: r.targetYear ?? null,
    achieved: r.achieved,
    achievedAt: r.achievedAt instanceof Date ? r.achievedAt.toISOString() : r.achievedAt ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export default router;
