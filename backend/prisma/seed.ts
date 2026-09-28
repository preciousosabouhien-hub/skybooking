import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const airports = [
    ["LOS", "Murtala Muhammed International Airport", "Lagos", "Nigeria"],
    ["ABV", "Nnamdi Azikiwe International Airport", "Abuja", "Nigeria"],
    ["LHR", "Heathrow Airport", "London", "United Kingdom"],
    ["DXB", "Dubai International Airport", "Dubai", "United Arab Emirates"],
    ["JFK", "John F. Kennedy International Airport", "New York", "United States"]
  ];
  for (const [code, name, city, country] of airports)
    await prisma.airport.upsert({ where: { code }, update: {}, create: { code, name, city, country } });

  const los = await prisma.airport.findUniqueOrThrow({ where: { code: "LOS" } });
  const lhr = await prisma.airport.findUniqueOrThrow({ where: { code: "LHR" } });
  const dxb = await prisma.airport.findUniqueOrThrow({ where: { code: "DXB" } });

  const sampleDate = new Date("2026-10-10T00:00:00.000Z");
  const flights = [
    { flightNumber: "SK101", airline: "SkyBook Airways", from: los.id, to: lhr.id, dep: new Date("2026-10-10T08:35:00.000Z"), durationMin: 390, economyPrice: 685, businessPrice: 1850 },
    { flightNumber: "SK119", airline: "SkyBook Airways", from: los.id, to: lhr.id, dep: new Date("2026-10-10T21:10:00.000Z"), durationMin: 390, economyPrice: 729, businessPrice: 1950 },
    { flightNumber: "AF220", airline: "AeroFly", from: los.id, to: lhr.id, dep: new Date("2026-10-10T11:20:00.000Z"), durationMin: 470, economyPrice: 542, businessPrice: 1560 },
    { flightNumber: "NV304", airline: "Nova Air", from: los.id, to: lhr.id, dep: new Date("2026-10-10T17:45:00.000Z"), durationMin: 455, economyPrice: 498, businessPrice: 1490 },
    { flightNumber: "SK202", airline: "SkyBook Airways", from: los.id, to: dxb.id, dep: new Date("2026-10-10T09:15:00.000Z"), durationMin: 470, economyPrice: 520, businessPrice: 1420 }
  ];
  for (const f of flights) {
    const arrival = new Date(f.dep.getTime() + f.durationMin * 60000);
    await prisma.flight.upsert({
      where: { flightNumber: f.flightNumber }, update: {},
      create: { flightNumber: f.flightNumber, airline: f.airline, departureId: f.from, arrivalId: f.to, departureTime: f.dep, arrivalTime: arrival, durationMin: f.durationMin, economyPrice: f.economyPrice, businessPrice: f.businessPrice, totalSeats: 180, availableSeats: 180 }
    });
  }

  const passwordHash = await bcrypt.hash("Admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@skybook.test" },
    update: { role: "ADMIN" },
    create: { name: "SkyBook Admin", email: "admin@skybook.test", passwordHash, role: "ADMIN" }
  });
  console.log("Seed complete. Admin: admin@skybook.test / Admin123!");
}
main().finally(() => prisma.$disconnect());