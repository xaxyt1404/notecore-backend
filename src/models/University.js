import mongoose from "mongoose";

const universitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    city: { type: String, default: "Cartagena", trim: true },
    // Esquema de cortes definido por la universidad (ej. [30, 30, 40] para UdeC)
    cutWeights: {
      type: [Number],
      default: [30, 30, 40],
      validate: {
        validator: (arr) =>
          Array.isArray(arr) &&
          arr.length > 0 &&
          arr.reduce((sum, w) => sum + Number(w || 0), 0) === 100,
        message:
          "Los porcentajes de los cortes de la universidad deben sumar 100%.",
      },
    },
    programs: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

universitySchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.schemaLabel = (ret.cutWeights || [30, 30, 40]).join("-");
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("University", universitySchema);
