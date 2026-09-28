import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const router = Router();

router.get("/airports", async (_req, res) => {
  res.json(await prisma.airport.findMany({ orderBy: { city: "asc" } }));
});

router.get("/", async (req, res) => {
  const schema = z.object({
    from: z.string().optional(), to: z.string().optional(),
    date: z.string().optional(), passengers: z.coerce.number().int().min(1).max(9).default(1)
  });
  const q = schema.parse(req.query);
  const start = q.date ? new Date(`${q.date}T00:00:00.000Z`) : undefined;
  const end = q.date ? new Date(`${q.date}T23:59:59.999Z`) : undefined;
  const flights = await prisma.flight.findMany({
    where: {
      availableSeats: { gte: q.passengers },
      departure: q.from ? { code: q.from.toUpperCase() } : undefined,
      arrival: q.to ? { code: q.to.toUpperCase() } : undefined,
      departureTime: start && end ? { gte: start, lte: end } : undefined
    },
    include: { departure: true, arrival: true },
    orderBy: { departureTime: "asc" }
  });
  res.json(flights);
});

router.get("/:id", async (req, res) => {
  const flight = await prisma.flight.findUnique({ where: { id: req.params.id }, include: { departure: true, arrival: true } });
  if (!flight) return res.status(404).json({ message: "Flight not found" });
  res.json(flight);
});

export default router;