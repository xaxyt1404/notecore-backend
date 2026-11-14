import { Router } from "express";
import {
  getUniversities,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  getAdminOverview,
  updateUserByAdmin,
  deleteUserByAdmin,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = Router();

// Catálogo público de universidades para el registro y perfil
router.get("/universities", getUniversities);

// Rutas exclusivas del panel de administración
router.get("/overview", protect, adminOnly, getAdminOverview);
router.post("/universities", protect, adminOnly, createUniversity);
router.put("/universities/:id", protect, adminOnly, updateUniversity);
router.delete("/universities/:id", protect, adminOnly, deleteUniversity);
router.patch("/users/:id", protect, adminOnly, updateUserByAdmin);
router.delete("/users/:id", protect, adminOnly, deleteUserByAdmin);

export default router;
