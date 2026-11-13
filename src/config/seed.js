import University from "../models/University.js";
import User from "../models/User.js";

const INITIAL_UNIVERSITIES = [
  {
    name: "Universidad de Cartagena",
    city: "Cartagena",
    cutWeights: [30, 30, 40],
    programs: [
      "Administración Agroindustrial",
      "Administración de Empresas",
      "Administración de Empresas Turísticas y Hoteleras",
      "Administración Financiera",
      "Administración Industrial",
      "Administración Pública",
      "Administración Servicios de la Salud",
      "Biología",
      "Comunicación Social",
      "Contaduría Pública",
      "Derecho",
      "Economía",
      "Enfermería",
      "Filosofía",
      "Historia",
      "Ingeniería Civil",
      "Ingeniería de Alimentos",
      "Ingeniería de Sistemas",
      "Ingeniería de Software",
      "Ingeniería Química",
      "Licenciatura en Educación con Énfasis en Ciencias Sociales y Ambientales",
      "Licenciatura en Educación Infantil",
      "Lingüística y Literatura",
      "Matemáticas",
      "Medicina",
      "Odontología",
      "Profesional Universitario en Lenguas Extranjeras",
      "Química",
      "Química Farmacéutica",
      "Seguridad y Salud en el Trabajo",
      "Técnica Profesional en Operación de Procesos Petroquímicos",
      "Técnica Profesional en Procesos de Gestión Pública",
      "Técnica Profesional en Procesos Metrológicos",
      "Técnico Profesional en Operación Turística",
      "Tecnología Agroindustrial",
      "Tecnología en Gestión Pública",
      "Tecnología en Gestión Turística",
      "Tecnología en Metrología Industrial",
      "Tecnología en Procesos Industriales",
      "Trabajo Social",
    ],
  },
];

export const runInitialSeed = async () => {
  try {
    // Sincroniza el catálogo oficial de la Universidad de Cartagena si existe o si está vacío
    const udc = INITIAL_UNIVERSITIES[0];
    const existingUdc = await University.findOne({ name: udc.name });

    if (!existingUdc) {
      await University.create(udc);
      console.log(
        "🌱 Universidad de Cartagena (40 programas) cargada en MongoDB.",
      );
    } else if (existingUdc.programs.length < udc.programs.length) {
      existingUdc.programs = udc.programs;
      existingUdc.cutWeights = udc.cutWeights;
      await existingUdc.save();
      console.log(
        "🔄 Catálogo de Universidad de Cartagena actualizado a 40 programas.",
      );
    }

    const adminEmail = "admin@notecore.com";
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        firstName: "Admin",
        lastName: "NoteCore",
        email: adminEmail,
        password: "Admin@2026",
        university: "Universidad de Cartagena",
        degree: "Administración del Sistema",
        role: "admin",
        roleLabel: "Administrador",
      });
      console.log(
        "🛡️ Usuario Admin inicial listo (admin@notecore.com / Admin@2026)",
      );
    }
  } catch (error) {
    console.error("⚠️ Error en seed inicial:", error.message);
  }
};
