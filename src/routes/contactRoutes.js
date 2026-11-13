import { Router } from "express";
import {
  sendContactMessage,
  getContactMessages,
  getMyReplies,
  updateContactStatus,
  deleteContactMessage,
} from "../controllers/contactController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", sendContactMessage);
router.get("/my-replies", protect, getMyReplies);
router.get("/", protect, adminOnly, getContactMessages);
router.patch("/:id", protect, adminOnly, updateContactStatus);
router.delete("/:id", protect, adminOnly, deleteContactMessage);

export default router;
