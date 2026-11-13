import { Router } from "express";
import { chatWithCoreAI } from "../controllers/aiController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/chat", protect, chatWithCoreAI);

export default router;
