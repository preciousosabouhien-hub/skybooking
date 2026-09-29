import "dotenv/config";
import express from "express";
import cors from "cors";
import auth from "./routes/auth.js";
import flights from "./routes/flights.js";
import bookings from "./routes/bookings.js";
import admin from "./routes/admin.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = [
  "https://skybooking-seven.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigin.includes(origin)) {callback(null, true);}
    else {callback(new Error("Not allowed by CORS"));}
  },
  credentials:true
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "skybook-api" }));
app.use("/api/auth", auth);
app.use("/api/flights", flights);
app.use("/api/bookings", bookings);
app.use("/api/admin", admin);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => console.log(`SkyBook API running on http://localhost:${port}`));