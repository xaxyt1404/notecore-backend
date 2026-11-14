import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    university: {
      type: String,
      default: "Universidad de Cartagena",
      trim: true,
    },
    degree: { type: String, default: "", trim: true },
    avatar: { type: String, default: "" },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    roleLabel: { type: String, default: "Estudiante Universitario" },
    semester: {
      period: { type: String, default: "Semestre 2026 - 2" },
      schema: { type: String, default: "30-30-40" },
    },
  },
  { timestamps: true },
);

// Encriptar contraseña antes de guardar
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Comparar contraseña en el login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Serializar limpio para el frontend (id, fullName y greetingName automáticos)
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.fullName = `${ret.firstName} ${ret.lastName}`.trim();
    ret.greetingName = ret.firstName.split(/\s+/)[0] || ret.firstName;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
