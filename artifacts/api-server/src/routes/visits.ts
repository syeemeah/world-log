import { Router, type Request, type Response } from "express";
import { db, visitsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  ListVisitsQueryParams,
  CreateVisitBody,
  GetVisitParams,
  UpdateVisitParams,
  UpdateVisitBody,
  DeleteVisitParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "./auth";

const router = Router();

router.get("/visits", requireAuth, async (req: Request, res: Response) => {
  const parsed = ListVisitsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { year, country } = parsed.data;
  const userId = (req as AuthRequest).authUser.id;

  let query = db.select().from(visitsTable).where(eq(visitsTable.userId, userId)).$dynamic();
  if (year) query = query.where(and(eq(visitsTable.userId, userId), sql`EXTRACT(YEAR FROM ${visitsTable.visitDate}) = ${year}`));
  if (country) query = query.where(and(eq(visitsTable.userId, userId), eq(visitsTable.country, country)));

  const visits = await query.orderBy(desc(visitsTable.visitDate));
  res.json(visits.map(formatVisit));
});

router.post("/visits", requireAuth, async (req: Request, res: Response) => {
  const parsed = CreateVisitBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const userId = (req as AuthRequest).authUser.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [visit] = await db.insert(visitsTable).values({ ...parsed.data, userId } as any).returning();
  res.status(201).json(formatVisit(visit));
});

router.get("/visits/:id", requireAuth, async (req: Request, res: Response) => {
  const parsed = GetVisitParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const userId = (req as AuthRequest).authUser.id;
  const [visit] = await db.select().from(visitsTable).where(
    and(eq(visitsTable.id, parsed.data.id), eq(visitsTable.userId, userId))
  );
  if (!visit) { res.status(404).json({ error: "Visit not found" }); return; }
  res.json(formatVisit(visit));
});

router.patch("/visits/:id", requireAuth, async (req: Request, res: Response) => {
  const paramsParsed = UpdateVisitParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateVisitBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }
  const userId = (req as AuthRequest).authUser.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [visit] = await db.update(visitsTable).set(bodyParsed.data as any).where(
    and(eq(visitsTable.id, paramsParsed.data.id), eq(visitsTable.userId, userId))
  ).returning();
  if (!visit) { res.status(404).json({ error: "Visit not found" }); return; }
  res.json(formatVisit(visit));
});

router.delete("/visits/:id", requireAuth, async (req: Request, res: Response) => {
  const parsed = DeleteVisitParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const userId = (req as AuthRequest).authUser.id;
  const [deleted] = await db.delete(visitsTable).where(
    and(eq(visitsTable.id, parsed.data.id), eq(visitsTable.userId, userId))
  ).returning();
  if (!deleted) { res.status(404).json({ error: "Visit not found" }); return; }
  res.status(204).send();
});

function formatVisit(v: typeof visitsTable.$inferSelect) {
  return {
    id: v.id,
    country: v.country,
    countryCode: v.countryCode,
    city: v.city,
    visitDate: v.visitDate,
    notes: v.notes ?? null,
    lat: v.lat,
    lng: v.lng,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
  };
}

export default router;
