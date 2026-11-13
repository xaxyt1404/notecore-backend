import User from "../models/User.js";
import Subject from "../models/Subject.js";
import ContactMessage from "../models/ContactMessage.js";
import University from "../models/University.js";

// GET /api/admin/universities (Público: para Register y ProfileModal)
export const getUniversities = async (req, res, next) => {
  try {
    const filter = req.query.all === "true" ? {} : { active: true };
    const universities = await University.find(filter).sort({ name: 1 });
    res.json({ ok: true, universities: universities.map((u) => u.toJSON()) });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/universities (Solo Admin: crear universidad con sus cortes y programas)
export const createUniversity = async (req, res, next) => {
  try {
    const {
      name,
      city = "Cartagena",
      cutWeights = [30, 30, 40],
      programs = [],
    } = req.body;
    if (!name?.trim()) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "El nombre de la institución es obligatorio.",
        });
    }

    const uni = await University.create({
      name: name.trim(),
      city: city.trim(),
      cutWeights: cutWeights.map(Number),
      programs: Array.isArray(programs)
        ? programs.map((p) => p.trim()).filter(Boolean)
        : [],
    });

    res.status(201).json({ ok: true, university: uni.toJSON() });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/universities/:id (Solo Admin: editar cortes, programas o estado)
export const updateUniversity = async (req, res, next) => {
  try {
    const uni = await University.findById(req.params.id);
    if (!uni) {
      return res
        .status(404)
        .json({ ok: false, message: "Institución no encontrada." });
    }

    const { name, city, cutWeights, programs, active } = req.body;
    if (name !== undefined) uni.name = name.trim();
    if (city !== undefined) uni.city = city.trim();
    if (Array.isArray(cutWeights)) uni.cutWeights = cutWeights.map(Number);
    if (Array.isArray(programs))
      uni.programs = programs.map((p) => p.trim()).filter(Boolean);
    if (active !== undefined) uni.active = Boolean(active);

    await uni.save();
    res.json({ ok: true, university: uni.toJSON() });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/universities/:id (Solo Admin)
export const deleteUniversity = async (req, res, next) => {
  try {
    const deleted = await University.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ ok: false, message: "Institución no encontrada." });
    }
    res.json({ ok: true, id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/overview (Solo Admin: métricas + usuarios + mensajes)
export const getAdminOverview = async (req, res, next) => {
  try {
    const [users, subjectsCount, messages, universities] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Subject.countDocuments(),
      ContactMessage.find().sort({ createdAt: -1 }),
      University.find().sort({ name: 1 }),
    ]);

    res.json({
      ok: true,
      stats: {
        totalUsers: users.length,
        totalSubjects: subjectsCount,
        pendingMessages: messages.filter((m) => m.status === "pending").length,
        totalUniversities: universities.length,
      },
      users: users.map((u) => u.toJSON()),
      messages: messages.map((m) => m.toJSON()),
      universities: universities.map((u) => u.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};
