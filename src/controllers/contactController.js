import ContactMessage from "../models/ContactMessage.js";

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
      subject: subject?.trim() || "Consulta desde NoteCore",
      message: message.trim(),
      source: source === "dashboard-support" ? "dashboard-support" : "landing",
    });

    res.status(201).json({
      ok: true,
      message: "¡Mensaje enviado correctamente! Te responderemos pronto.",
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

// PATCH /api/contact/:id (Solo Admin: marcar resuelto/pendiente)
export const updateContactStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status: status === "resolved" ? "resolved" : "pending" },
      { new: true },
    );
    if (!msg) {
      return res
        .status(404)
        .json({ ok: false, message: "Mensaje no encontrado." });
    }
    res.json({ ok: true, contact: msg.toJSON() });
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
