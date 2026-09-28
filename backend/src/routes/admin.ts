import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/stats", async (_req, res) => {
  const [users, flights, bookings, confirmedBookings, cancelledBookings, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.flight.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { status: "CONFIRMED" } }),
  ]);
  res.json({
    users, flights, bookings, confirmedBookings, cancelledBookings,
    revenue: revenue._sum.totalAmount || 0,
  });
});

router.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

router.patch("/users/:id/role", async (req, res) => {
  const data = z.object({ role: z.enum(["USER", "ADMIN"]) }).parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: data.role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json(user);
});

router.get("/bookings", async (_req, res) => {
  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      flight: { include: { departure: true, arrival: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(bookings);
});

router.patch("/bookings/:id/status", async (req, res) => {
  const data = z.object({ status: z.enum(["CONFIRMED", "CANCELLED"]) }).parse(req.body);
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.status === data.status) return res.json(booking);

  try {
    const updated = await prisma.$transaction(async tx => {
      if (data.status === "CONFIRMED") {
        const flight = await tx.flight.findUnique({ where: { id: booking.flightId } });
        if (!flight) throw new Error("Flight not found");
        if (flight.availableSeats < booking.passengerCount) throw new Error("Not enough seats available to restore this booking");
      }
      const updatedBooking = await tx.booking.update({ where: { id: booking.id }, data: { status: data.status } });
      if (data.status === "CANCELLED") {
        await tx.flight.update({ where: { id: booking.flightId }, data: { availableSeats: { increment: booking.passengerCount } } });
      } else {
        await tx.flight.update({ where: { id: booking.flightId }, data: { availableSeats: { decrement: booking.passengerCount } } });
      }
      return updatedBooking;
    });
    res.json(updated);
  } catch (e) {
    res.status(409).json({ message: e instanceof Error ? e.message : "Could not update booking" });
  }
});

const flightSchema = z.object({
  flightNumber: z.string().min(2),
  airline: z.string().min(2),
  departureTime: z.coerce.date(),
  arrivalTime: z.coerce.date(),
  durationMin: z.coerce.number().int().positive(),
  economyPrice: z.coerce.number().positive(),
  businessPrice: z.coerce.number().positive(),
  totalSeats: z.coerce.number().int().positive(),
  departureId: z.string().min(1),
  arrivalId: z.string().min(1),
});

router.get("/flights", async (_req, res) => {
  res.json(await prisma.flight.findMany({
    include: { departure: true, arrival: true },
    orderBy: { departureTime: "asc" },
  }));
});

router.post("/flights", async (req, res) => {
  try {
    const data = flightSchema.parse(req.body);
    if (data.departureId === data.arrivalId) return res.status(400).json({ message: "Departure and arrival must differ" });
    const flight = await prisma.flight.create({ data: { ...data, availableSeats: data.totalSeats } });
    res.status(201).json(flight);
  } catch (e) {
    res.status(400).json({ message: e instanceof Error ? e.message : "Invalid flight" });
  }
});

router.patch("/flights/:id", async (req, res) => {
  try {
    const data = flightSchema.partial().parse(req.body);
    const current = await prisma.flight.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ message: "Flight not found" });
    const departureId = data.departureId ?? current.departureId;
    const arrivalId = data.arrivalId ?? current.arrivalId;
    if (departureId === arrivalId) return res.status(400).json({ message: "Departure and arrival must differ" });
    const occupied = current.totalSeats - current.availableSeats;
    if (data.totalSeats !== undefined && data.totalSeats < occupied) return res.status(400).json({ message: `Total seats cannot be below ${occupied} occupied seats` });
    const updateData: any = { ...data };
    if (data.totalSeats !== undefined) updateData.availableSeats = data.totalSeats - occupied;
    res.json(await prisma.flight.update({ where: { id: current.id }, data: updateData }));
  } catch (e) {
    res.status(400).json({ message: e instanceof Error ? e.message : "Invalid flight" });
  }
});

router.delete("/flights/:id", async (req, res) => {
  const flight = await prisma.flight.findUnique({ where: { id: req.params.id } });
  if (!flight) return res.status(404).json({ message: "Flight not found" });
  const confirmed = await prisma.booking.count({ where: { flightId: flight.id, status: "CONFIRMED" } });
  if (confirmed > 0) return res.status(409).json({ message: "Cannot delete a flight with confirmed bookings" });
  await prisma.flight.delete({ where: { id: flight.id } });
  res.status(204).end();
});

export default router;
