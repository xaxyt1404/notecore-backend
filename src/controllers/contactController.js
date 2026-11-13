import ContactMessage from "../models/ContactMessage.js";
import User from "../models/User.js";

// POST /api/contact (Público: Landing y Soporte)
export const sendContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message, source } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        ok: false,
        message: "Nombre, correo y mensaje son obligatorios.",
      });
    }

    const created = await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || "Mensaje enviado por NoteCore",
      message: message.trim(),
      source: source === "dashboard-support" ? "dashboard-support" : "landing",
    });

    res.status(201).json({
      ok: true,
      message: "¡Mensaje enviado por NoteCore! Te responderemos pronto.",
      contact: created.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/contact (Solo Admin)
export const getContactMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ ok: true, messages: messages.map((m) => m.toJSON()) });
  } catch (error) {
    next(error);
  }
};

// GET /api/contact/my-replies (Usuario autenticado: notificaciones de respuestas del Admin)
export const getMyReplies = async (req, res, next) => {
  try {
    const replies = await ContactMessage.find({
      email: req.user.email,
      status: "resolved",
      adminReply: { $ne: "" },
    }).sort({ repliedAt: -1 });

    res.json({ ok: true, replies: replies.map((r) => r.toJSON()) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/contact/:id (Solo Admin: responder y/o marcar resuelto)
export const updateContactStatus = async (req, res, next) => {
  try {
    const { status, adminReply } = req.body;
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) {
      return res
        .status(404)
        .json({ ok: false, message: "Mensaje no encontrado." });
    }

    if (adminReply !== undefined && adminReply.trim()) {
      msg.adminReply = adminReply.trim();
      msg.repliedAt = new Date();
      msg.status = "resolved";
      msg.userReadReply = false;
    } else if (status) {
      msg.status = status === "resolved" ? "resolved" : "pending";
    }

    await msg.save();

    const registeredUser = await User.findOne({ email: msg.email });

    res.json({
      ok: true,
      hasAccount: Boolean(registeredUser),
      contact: msg.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/contact/:id (Solo Admin)
export const deleteContactMessage = async (req, res, next) => {
  try {
    const deleted = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ ok: false, message: "Mensaje no encontrado." });
    }
    res.json({ ok: true, id: req.params.id });
  } catch (error) {
    next(error);
  }
};
