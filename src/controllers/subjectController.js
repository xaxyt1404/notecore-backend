import Subject from "../models/Subject.js";
import { buildUniversityCuts } from "./authController.js";

// GET /api/subjects
export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({
      createdAt: 1,
    });
    res.json({ ok: true, subjects: subjects.map((s) => s.toJSON()) });
  } catch (error) {
    next(error);
  }
};

// POST /api/subjects
export const createSubject = async (req, res, next) => {
  try {
    const { name, statsName, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        ok: false,
        message: "El nombre de la asignatura es obligatorio.",
      });
    }

    const templateCuts = await buildUniversityCuts(req.user.university);

    const subject = await Subject.create({
      user: req.user._id,
      name: name.trim(),
      statsName: (statsName || name).trim(),
      icon: icon || "fa-book",
      current: 0.0,
      statusLabel: "Sin notas",
      performance: "Sin notas",
      cuts: templateCuts,
      simulations: [],
    });

    res.status(201).json({ ok: true, subject: subject.toJSON() });
  } catch (error) {
    next(error);
  }
};

// PUT /api/subjects/:id
export const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!subject) {
      return res
        .status(404)
        .json({ ok: false, message: "Asignatura no encontrada." });
    }

    const {
      name,
      statsName,
      icon,
      current,
      statusLabel,
      performance,
      cuts,
      simulations,
    } = req.body;

    if (name !== undefined) subject.name = name.trim();
    if (statsName !== undefined) subject.statsName = statsName.trim();
    if (icon !== undefined) subject.icon = icon;
    if (current !== undefined) subject.current = Number(current);
    if (statusLabel !== undefined) subject.statusLabel = statusLabel;
    if (performance !== undefined) subject.performance = performance;
    if (Array.isArray(cuts)) subject.cuts = cuts;
    if (Array.isArray(simulations)) subject.simulations = simulations;

    await subject.save();
    res.json({ ok: true, subject: subject.toJSON() });
  } catch (error) {
    next(error);
  }
};

// POST /api/subjects/:id/simulations
export const addSubjectSimulation = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!subject) {
      return res
        .status(404)
        .json({ ok: false, message: "Asignatura no encontrada." });
    }

    const { toolId, toolTitle, summary } = req.body;
    const newSim = {
      id: Date.now(),
      toolId,
      toolTitle,
      summary,
      createdAt: new Date().toISOString(),
    };

    subject.simulations.unshift(newSim);
    await subject.save();

    res.status(201).json({ ok: true, subject: subject.toJSON() });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/subjects/:id
export const deleteSubject = async (req, res, next) => {
  try {
    const deleted = await Subject.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!deleted) {
      return res
        .status(404)
        .json({ ok: false, message: "Asignatura no encontrada." });
    }
    res.json({ ok: true, id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// POST /api/subjects/import (Restaurar respaldo JSON)
export const importSubjects = async (req, res, next) => {
  try {
    const { subjects } = req.body;
    if (!Array.isArray(subjects)) {
      return res
        .status(400)
        .json({ ok: false, message: "Formato de respaldo inválido." });
    }

    await Subject.deleteMany({ user: req.user._id });

    const restored = await Subject.insertMany(
      subjects.map((s) => ({
        user: req.user._id,
        name: s.name,
        statsName: s.statsName || s.name,
        icon: s.icon || "fa-book",
        current: Number(s.current) || 0,
        statusLabel: s.statusLabel || "Sin notas",
        performance: s.performance || s.statusLabel || "Sin notas",
        cuts: s.cuts || [],
        simulations: s.simulations || [],
      })),
    );

    res.json({ ok: true, subjects: restored.map((s) => s.toJSON()) });
  } catch (error) {
    next(error);
  }
};
