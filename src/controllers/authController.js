import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Subject from "../models/Subject.js";
import University from "../models/University.js";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const getAutoSemesterName = () => {
  const now = new Date();
  const period = now.getMonth() < 6 ? 1 : 2;
  return `Semestre ${now.getFullYear()} - ${period}`;
};

// Construye los cortes iniciales según el desglose configurado para la universidad
export const buildUniversityCuts = async (universityName) => {
  const uni = await University.findOne({ name: universityName });
  const weights = uni?.cutWeights?.length ? uni.cutWeights : [30, 30, 40];

  return weights.map((weight, idx) => ({
    id: idx + 1,
    name: `Corte ${idx + 1}`,
    weight,
    activities: [],
    parcial: { grade: 0, weight: 100, locked: true },
    bonus: 0,
  }));
};

// POST /api/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      university,
      degree,
      subjects = [],
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !university ||
      !degree
    ) {
      return res
        .status(400)
        .json({ ok: false, message: "Todos los campos son obligatorios." });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res
        .status(400)
        .json({ ok: false, message: "Este correo ya está registrado." });
    }

    const uni = await University.findOne({ name: university });
    const cutWeights = uni?.cutWeights?.length ? uni.cutWeights : [30, 30, 40];

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      university,
      degree,
      semester: {
        period: getAutoSemesterName(),
        schema: cutWeights.join("-"),
      },
    });

    const templateCuts = await buildUniversityCuts(university);

    const createdSubjects =
      Array.isArray(subjects) && subjects.length > 0
        ? await Subject.insertMany(
            subjects.map((s) => ({
              user: user._id,
              name: s.name,
              statsName: s.statsName || s.name,
              icon: s.icon || "fa-book",
              current: 0.0,
              statusLabel: "Sin notas",
              performance: "Sin notas",
              cuts: JSON.parse(JSON.stringify(templateCuts)),
              simulations: [],
            })),
          )
        : [];

    res.status(201).json({
      ok: true,
      token: generateToken(user._id),
      user: user.toJSON(),
      subjects: createdSubjects.map((s) => s.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: (email || "").toLowerCase().trim(),
    });
    if (!user || !(await user.matchPassword(password || ""))) {
      return res
        .status(401)
        .json({ ok: false, message: "Correo o contraseña incorrectos." });
    }

    const subjects = await Subject.find({ user: user._id }).sort({
      createdAt: 1,
    });

    res.json({
      ok: true,
      token: generateToken(user._id),
      user: user.toJSON(),
      subjects: subjects.map((s) => s.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/google
export const googleLogin = async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res
        .status(400)
        .json({ ok: false, message: "Falta el token de Google." });
    }

    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!googleRes.ok) {
      return res
        .status(401)
        .json({ ok: false, message: "Token de Google inválido." });
    }

    const googleData = await googleRes.json();
    const email = (googleData.email || "").toLowerCase().trim();
    if (!email) {
      return res.status(400).json({
        ok: false,
        message: "No se pudo obtener el correo de Google.",
      });
    }

    // Se ignora googleData.picture explícitamente para no recibir ni guardar foto de perfil
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstName: (
          googleData.given_name ||
          googleData.name ||
          "Estudiante"
        ).trim(),
        lastName: (googleData.family_name || "").trim() || "NoteCore",
        email,
        password: crypto.randomBytes(24).toString("hex"),
        university: "Universidad de Cartagena",
        degree: "",
        avatar: "",
        role: "student",
        roleLabel: "Estudiante Universitario",
        semester: {
          period: getAutoSemesterName(),
          schema: "30-30-40",
        },
      });
    }

    const subjects = await Subject.find({ user: user._id }).sort({
      createdAt: 1,
    });

    res.json({
      ok: true,
      token: generateToken(user._id),
      user: user.toJSON(),
      subjects: subjects.map((s) => s.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({
      createdAt: 1,
    });
    res.json({
      ok: true,
      user: req.user.toJSON(),
      subjects: subjects.map((s) => s.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email, university, degree, avatar } = req.body;

    if (email && email.toLowerCase().trim() !== req.user.email) {
      const emailTaken = await User.findOne({
        email: email.toLowerCase().trim(),
      });
      if (emailTaken) {
        return res
          .status(400)
          .json({ ok: false, message: "Ese correo ya está en uso." });
      }
      req.user.email = email.toLowerCase().trim();
    }

    if (firstName !== undefined) req.user.firstName = firstName.trim();
    if (lastName !== undefined) req.user.lastName = lastName.trim();
    if (university !== undefined) req.user.university = university.trim();
    if (degree !== undefined) req.user.degree = degree.trim();
    if (avatar !== undefined) req.user.avatar = avatar;

    await req.user.save();

    res.json({
      ok: true,
      user: req.user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-semester
export const resetSemester = async (req, res, next) => {
  try {
    const templateCuts = await buildUniversityCuts(req.user.university);
    const userSubjects = await Subject.find({ user: req.user._id });

    for (const sub of userSubjects) {
      sub.current = 0.0;
      sub.statusLabel = "Sin notas";
      sub.performance = "Sin notas";
      sub.cuts = JSON.parse(JSON.stringify(templateCuts));
      sub.simulations = [];
      await sub.save();
    }

    res.json({
      ok: true,
      subjects: userSubjects.map((s) => s.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/account
export const deleteAccount = async (req, res, next) => {
  try {
    await Subject.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ ok: true, message: "Cuenta y asignaturas eliminadas." });
  } catch (error) {
    next(error);
  }
};
