import { Router } from "express";
import { db, visitsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  ListVisitsQueryParams,
  CreateVisitBody,
  GetVisitParams,
  UpdateVisitParams,
  UpdateVisitBody,
  DeleteVisitParams,
} from "@workspace/api-zod";
import { requireAuth } from "./auth";

const router = Router();

router.get("/visits", async (req, res) => {
  const parsed = ListVisitsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { year, country } = parsed.data;

  let query = db.select().from(visitsTable).$dynamic();
  if (year) query = query.where(sql`EXTRACT(YEAR FROM ${visitsTable.visitDate}) = ${year}`);
  if (country) query = query.where(eq(visitsTable.country, country));

  const visits = await query.orderBy(desc(visitsTable.visitDate));
  res.json(visits.map(formatVisit));
});

router.post("/visits", requireAuth, async (req, res) => {
  const parsed = CreateVisitBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [visit] = await db.insert(visitsTable).values(parsed.data).returning();
  res.status(201).json(formatVisit(visit));
});

router.get("/visits/:id", async (req, res) => {
  const parsed = GetVisitParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [visit] = await db.select().from(visitsTable).where(eq(visitsTable.id, parsed.data.id));
  if (!visit) { res.status(404).json({ error: "Visit not found" }); return; }
  res.json(formatVisit(visit));
});

router.patch("/visits/:id", requireAuth, async (req, res) => {
  const paramsParsed = UpdateVisitParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateVisitBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }
  const [visit] = await db.update(visitsTable).set(bodyParsed.data).where(eq(visitsTable.id, paramsParsed.data.id)).returning();
  if (!visit) { res.status(404).json({ error: "Visit not found" }); return; }
  res.json(formatVisit(visit));
});

router.delete("/visits/:id", requireAuth, async (req, res) => {
  const parsed = DeleteVisitParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(visitsTable).where(eq(visitsTable.id, parsed.data.id)).returning();
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
