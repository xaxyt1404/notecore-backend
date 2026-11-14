import Subject from "../models/Subject.js";

const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
];

const buildAcademicSummary = (user, subjects) => {
  if (!subjects.length) {
    return `${user.firstName} aún no tiene asignaturas registradas en el sistema.`;
  }
  return subjects
    .map((s) => {
      const cutsInfo = (s.cuts || [])
        .map(
          (c) =>
            `${c.name} (${c.weight}%): parcial=${c.parcial?.grade ?? 0}, bono=${c.bonus ?? 0}`,
        )
        .join(" | ");
      return `- ${s.name}: nota actual ${Number(s.current || 0).toFixed(2)}/5.0 (${s.statusLabel}) [${cutsInfo}]`;
    })
    .join("\n");
};

const localSmartReply = (user, subjects, message) => {
  const name = user.firstName?.split(/\s+/)[0] || "Estudiante";
  if (!subjects.length) {
    return `¡Hola ${name}! Todavía no tienes asignaturas cargadas. Ve a "Asignaturas" para agregar tus materias del semestre y te ayudo a proyectar tus notas.`;
  }

  const withGrades = subjects.filter((s) => Number(s.current) > 0);
  const atRisk = withGrades.filter((s) => Number(s.current) < 3.0);
  const sorted = [...withGrades].sort((a, b) => a.current - b.current);

  if (/riesgo|perder|baja|priorizar|ayuda|recomienda/i.test(message)) {
    if (atRisk.length > 0) {
      const list = atRisk
        .map((s) => `${s.name} (${s.current.toFixed(2)})`)
        .join(", ");
      return `${name}, ahora mismo debes priorizar: ${list}. Abre la herramienta "¿Cuánto necesito en mi parcial?" o "Calculadora de Estrategia" para calcular la nota exacta que necesitas en los cortes pendientes.`;
    }
    if (sorted.length > 0) {
      return `¡Vas bien, ${name}! Ninguna materia con notas registradas está por debajo de 3.0. Tu materia más ajustada es ${sorted[0].name} (${sorted[0].current.toFixed(2)}), así que te recomiendo asegurar un buen resultado en su próximo corte.`;
    }
  }

  if (/promedio|general|como voy|cómo voy/i.test(message)) {
    if (!withGrades.length) {
      return `Aún todas tus materias (${subjects.length}) están en "Sin notas". Registra tus primeras calificaciones en Asignaturas para calcular tu promedio.`;
    }
    const avg =
      withGrades.reduce((acc, s) => acc + s.current, 0) / withGrades.length;
    return `Tu promedio actual entre las ${withGrades.length} asignaturas evaluadas es ${avg.toFixed(2)} / 5.0. ${
      atRisk.length
        ? `Tienes ${atRisk.length} materia(s) en riesgo que conviene reforzar.`
        : "Mantienes todas las materias evaluadas aprobadas."
    }`;
  }

  return `¡Hola ${name}! Tienes ${subjects.length} asignatura(s) en ${user.university}. Pregúntame cómo va tu promedio, qué materias priorizar o cómo proyectar tus próximos parciales.`;
};

// POST /api/ai/chat
export const chatWithCoreAI = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: "Escribe un mensaje para CoreAI." });
    }

    const subjects = await Subject.find({ user: req.user._id });
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (apiKey) {
      const context = buildAcademicSummary(req.user, subjects);
      const prompt = `Eres CoreAI, el asistente académico de la plataforma NoteCore. Responde en español, de forma cercana, breve (máximo 4 líneas) y práctica usando los datos reales del estudiante.\n\nEstudiante: ${req.user.firstName} ${req.user.lastName} (${req.user.university} - ${req.user.degree})\nAsignaturas:\n${context}\n\nPregunta del estudiante: ${message.trim()}`;

      for (const model of GEMINI_MODELS) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            console.log(`🤖 CoreAI respondió con ${model}`);
            return res.json({
              ok: true,
              reply: reply.trim(),
              source: "gemini",
            });
          }
        } else {
          const errText = await response.text();
          console.error(
            `❌ Error Gemini [${model}] (${response.status}):`,
            errText,
          );
        }
      }
    }

    const reply = localSmartReply(req.user, subjects, message.trim());
    res.json({ ok: true, reply, source: "coreai-engine" });
  } catch (error) {
    next(error);
  }
};
