import { Router } from "express";
import {
  getSubjects,
  createSubject,
  updateSubject,
  addSubjectSimulation,
  deleteSubject,
  importSubjects,
} from "../controllers/subjectController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", getSubjects);
router.post("/", createSubject);
router.post("/import", importSubjects);
router.put("/:id", updateSubject);
router.post("/:id/simulations", addSubjectSimulation);
router.delete("/:id", deleteSubject);

export default router;
