import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

// Ruta de verificación de estado
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "NoteCore API",
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

// Middleware de ruta no encontrada
app.use((req, res) => {
  res
    .status(404)
    .json({ ok: false, message: `Ruta no encontrada: ${req.originalUrl}` });
});

// Middleware global de errores
app.use((err, req, res, _next) => {
  console.error("🔥 Error:", err.message);
  res.status(err.statusCode || 500).json({
    ok: false,
    message: err.message || "Error interno del servidor",
  });
});

export default app;
