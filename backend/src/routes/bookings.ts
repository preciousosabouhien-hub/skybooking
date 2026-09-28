import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const bookingSchema = z.object({
  flightId: z.string(),
  tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]),
  cabinClass: z.enum(["economy", "business"]),
  seats: z.array(z.string()).min(1).max(9),
  passengerData: z.array(z.object({
    firstName: z.string().min(1), lastName: z.string().min(1),
    email: z.string().email(), phone: z.string().min(5)
  })).min(1).max(9)
});

function ref() { return `SKY-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`; }


// Public ticket verification by booking reference. Only non-sensitive ticket
// information is returned; passenger contact details are never exposed.
router.get("/verify/:reference", async (req, res) => {
  const reference = req.params.reference.trim().toUpperCase();
  if (!reference) return res.status(400).json({ message: "Booking number is required" });

  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: {
      flight: { include: { departure: true, arrival: true } }
    }
  });

  if (!booking) return res.status(404).json({ message: "Ticket not found. Check the booking number and try again." });

  res.json({
    valid: booking.status === "CONFIRMED",
    reference: booking.reference,
    status: booking.status,
    passengerCount: booking.passengerCount,
    cabinClass: booking.cabinClass,
    tripType: booking.tripType,
    createdAt: booking.createdAt,
    flight: {
      flightNumber: booking.flight.flightNumber,
      airline: booking.flight.airline,
      departureTime: booking.flight.departureTime,
      arrivalTime: booking.flight.arrivalTime,
      departure: { code: booking.flight.departure.code, city: booking.flight.departure.city, country: booking.flight.departure.country },
      arrival: { code: booking.flight.arrival.code, city: booking.flight.arrival.city, country: booking.flight.arrival.country }
    }
  });
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = bookingSchema.parse(req.body);
    if (data.seats.length !== data.passengerData.length) return res.status(400).json({ message: "Seat and passenger counts must match" });

    const result = await prisma.$transaction(async tx => {
      const flight = await tx.flight.findUnique({ where: { id: data.flightId } });
      if (!flight) throw new Error("Flight not found");
      if (flight.availableSeats < data.seats.length) throw new Error("Not enough seats available");

      const price = data.cabinClass === "business" ? Number(flight.businessPrice) : Number(flight.economyPrice);
      const booking = await tx.booking.create({
        data: {
          reference: ref(), status: "CONFIRMED", tripType: data.tripType,
          cabinClass: data.cabinClass, totalAmount: price * data.passengerData.length,
          passengerCount: data.passengerData.length, seats: data.seats,
          passengerData: data.passengerData, userId: req.user!.id, flightId: data.flightId
        },
        include: { flight: { include: { departure: true, arrival: true } } }
      });
      await tx.flight.update({ where: { id: data.flightId }, data: { availableSeats: { decrement: data.seats.length } } });
      return booking;
    });
    res.status(201).json(result);
  } catch (e) { res.status(400).json({ message: e instanceof Error ? e.message : "Booking failed" }); }
});

router.get("/mine", requireAuth, async (req: AuthRequest, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user!.id },
    include: { flight: { include: { departure: true, arrival: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json(bookings);
});

router.post("/:id/cancel", requireAuth, async (req: AuthRequest, res) => {
  const booking = await prisma.booking.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.status === "CANCELLED") return res.status(400).json({ message: "Booking already cancelled" });
  const updated = await prisma.$transaction(async tx => {
    const b = await tx.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
    await tx.flight.update({ where: { id: booking.flightId }, data: { availableSeats: { increment: booking.passengerCount } } });
    return b;
  });
  res.json(updated);
});

export default router;