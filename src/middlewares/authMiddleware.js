import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ ok: false, message: "No autorizado: falta token." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ ok: false, message: "Usuario no encontrado o eliminado." });
    }

    req.user = user;
    next();
  } catch {
    return res
      .status(401)
      .json({ ok: false, message: "Token inválido o expirado." });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ ok: false, message: "Acceso exclusivo para administradores." });
  }
  next();
};
