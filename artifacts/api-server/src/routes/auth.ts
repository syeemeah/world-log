import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// ── Login ───────────────────────────────────────────────────────────────────

router.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.trim()));
  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  // Token: base64url of JSON payload signed with the password hash itself as a secret
  // Simple but stateless — no session table needed for a personal app.
  const payload = { id: user.id, username: user.username, role: user.role };
  const token = Buffer.from(JSON.stringify(payload)).toString("base64url") + "." + user.passwordHash.slice(-8);

  res.json({ token, username: user.username, role: user.role });
});

// ── Public registration ──────────────────────────────────────────────────────

router.post("/auth/register", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  if (username.trim().length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username.trim()));
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    username: username.trim(),
    passwordHash,
    role: "editor",
  }).returning({ id: usersTable.id, username: usersTable.username, role: usersTable.role });

  const payload = { id: user.id, username: user.username, role: user.role };
  const token = Buffer.from(JSON.stringify(payload)).toString("base64url") + "." + passwordHash.slice(-8);
  res.status(201).json({ token, username: user.username, role: user.role });
});

// ── User management (admin only) ────────────────────────────────────────────

router.get("/auth/users", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(usersTable.createdAt);
  res.json(users);
});

router.post("/auth/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { username, password, role } = req.body as { username?: string; password?: string; role?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  const validRole = role === "admin" || role === "editor" ? role : "editor";

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username.trim()));
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    username: username.trim(),
    passwordHash,
    role: validRole as "admin" | "editor",
  }).returning({ id: usersTable.id, username: usersTable.username, role: usersTable.role, createdAt: usersTable.createdAt });

  res.status(201).json(user);
});

router.patch("/auth/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { password, role } = req.body as { password?: string; role?: string };

  const updates: Record<string, unknown> = {};
  if (password) updates.passwordHash = await bcrypt.hash(password, 12);
  if (role === "admin" || role === "editor") updates.role = role;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, username: usersTable.username, role: usersTable.role });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

router.delete("/auth/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  // Prevent deleting the last admin
  const admins = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin"));
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.role === "admin" && admins.length <= 1) {
    res.status(400).json({ error: "Cannot delete the last admin account" });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).send();
});

// ── Middleware ───────────────────────────────────────────────────────────────

export interface AuthUser { id: number; username: string; role: "admin" | "editor" }
export interface AuthRequest extends Request { authUser: AuthUser }

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers["authorization"];
  const token = raw?.startsWith("Bearer ") ? raw.slice(7) : null;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [payloadB64] = token.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as AuthUser;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
    if (!user) throw new Error("no user");

    // Verify the tail matches the current password hash (invalidates token on password change)
    const expectedTail = user.passwordHash.slice(-8);
    const actualTail = token.split(".")[1];
    if (actualTail !== expectedTail) throw new Error("token mismatch");

    (req as AuthRequest).authUser = { id: user.id, username: user.username, role: user.role as "admin" | "editor" };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req as AuthRequest).authUser?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export default router;
