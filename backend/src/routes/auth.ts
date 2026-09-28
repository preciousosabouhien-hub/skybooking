import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";

const router = Router();
const authSchema = z.object({ name: z.string().min(2).optional(), email: z.string().email(), password: z.string().min(6) });

function token(user: { id: string; role: "USER" | "ADMIN" }) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const data = authSchema.parse(req.body);
    if (!data.name) return res.status(400).json({ message: "Name is required" });
    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (exists) return res.status(409).json({ message: "Email already registered" });
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email.toLowerCase(), passwordHash: await bcrypt.hash(data.password, 12) }
    });
    res.status(201).json({ token: token(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(400).json({ message: e instanceof Error ? e.message : "Invalid request" }); }
});

router.post("/login", async (req, res) => {
  try {
    const data = authSchema.omit({ name: true }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) return res.status(401).json({ message: "Invalid email or password" });
    res.json({ token: token(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(400).json({ message: e instanceof Error ? e.message : "Invalid request" }); }
});

export default router;