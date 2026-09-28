import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export type AuthRequest = Request & { user?: { id: string; role: "USER" | "ADMIN" } };

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET || "dev-secret") as { id: string; role: "USER" | "ADMIN" };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Admin access required" });
  next();
}