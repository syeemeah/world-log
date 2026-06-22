import { Router, type Request, type Response } from "express";
import { db, feedbackTable, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "./auth";

const router = Router();

const VALID_CATEGORIES = ["bug", "idea", "other"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

// Submit feedback (any signed-in user)
router.post("/feedback", requireAuth, async (req: Request, res: Response) => {
  const { category, message } = req.body as { category?: string; message?: string };
  if (!message || !message.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  if (message.length > 5000) {
    res.status(400).json({ error: "Message is too long (max 5000 characters)" });
    return;
  }
  const validCategory: Category = VALID_CATEGORIES.includes(category as Category)
    ? (category as Category)
    : "other";
  const userId = (req as AuthRequest).authUser.id;

  const [row] = await db
    .insert(feedbackTable)
    .values({ userId, category: validCategory, message: message.trim() })
    .returning();
  res.status(201).json({
    id: row.id,
    category: row.category,
    message: row.message,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  });
});

// List all feedback (admin only)
router.get("/feedback", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      id: feedbackTable.id,
      category: feedbackTable.category,
      message: feedbackTable.message,
      createdAt: feedbackTable.createdAt,
      username: usersTable.username,
    })
    .from(feedbackTable)
    .leftJoin(usersTable, eq(feedbackTable.userId, usersTable.id))
    .orderBy(desc(feedbackTable.createdAt));

  res.json(
    rows.map((r) => ({
      id: r.id,
      category: r.category,
      message: r.message,
      username: r.username ?? "(deleted user)",
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    }))
  );
});

// Delete a feedback entry (admin only)
router.delete("/feedback/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deleted] = await db.delete(feedbackTable).where(eq(feedbackTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
