import { Router } from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  resetSemester,
  deleteAccount,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.post("/reset-semester", protect, resetSemester);
router.delete("/account", protect, deleteAccount);

export default router;
