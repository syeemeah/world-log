import { Router, type Request, type Response, type NextFunction } from "express";

const router = Router();

// Simple token-based auth: POST /api/auth/login returns a token
// The token IS the password (hashed comparison happens server-side)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

router.post("/auth/login", (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  if (!password || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  // Return the password as the bearer token (server validates on every write)
  res.json({ token: ADMIN_PASSWORD });
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || token !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export default router;
