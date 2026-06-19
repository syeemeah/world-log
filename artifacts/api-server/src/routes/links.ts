import { Router } from "express";
import { db, travelLinksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

router.get("/links", async (_req, res) => {
  const rows = await db.select().from(travelLinksTable).orderBy(desc(travelLinksTable.year), desc(travelLinksTable.createdAt));
  res.json(rows.map(fmt));
});

router.post("/links", requireAuth, async (req, res) => {
  const { year, title, url, type, description } = req.body as {
    year?: number; title?: string; url?: string; type?: string; description?: string;
  };
  if (!year || !title || !url) {
    res.status(400).json({ error: "year, title, and url are required" });
    return;
  }
  const validType = (["blog", "photos", "other"] as const).includes(type as "blog" | "photos" | "other")
    ? (type as "blog" | "photos" | "other")
    : "blog";

  const [row] = await db.insert(travelLinksTable).values({
    year: Number(year), title, url, type: validType, description: description ?? null,
  }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/links/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { year, title, url, type, description } = req.body as {
    year?: number; title?: string; url?: string; type?: string; description?: string;
  };
  const updates: Record<string, unknown> = {};
  if (year) updates.year = Number(year);
  if (title) updates.title = title;
  if (url) updates.url = url;
  if (type && ["blog", "photos", "other"].includes(type)) updates.type = type;
  if (description !== undefined) updates.description = description ?? null;

  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  const [row] = await db.update(travelLinksTable).set(updates).where(eq(travelLinksTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/links/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [deleted] = await db.delete(travelLinksTable).where(eq(travelLinksTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});

function fmt(r: typeof travelLinksTable.$inferSelect) {
  return {
    id: r.id,
    year: r.year,
    title: r.title,
    url: r.url,
    type: r.type,
    description: r.description ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export default router;
