import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.Mixed, required: true },
    name: { type: String, required: true, trim: true },
    grade: { type: Number, default: 0, min: 0, max: 5 },
    weight: { type: Number, default: 0, min: 0, max: 100 },
    locked: { type: Boolean, default: false },
  },
  { _id: false },
);

const cutSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    activities: { type: [activitySchema], default: [] },
    parcial: {
      grade: { type: Number, default: 0, min: 0, max: 5 },
      weight: { type: Number, default: 100, min: 0, max: 100 },
      locked: { type: Boolean, default: true },
    },
    bonus: { type: Number, default: 0, min: 0, max: 1 },
  },
  { _id: false },
);

const simulationSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.Mixed, required: true },
    toolId: { type: String, required: true },
    toolTitle: { type: String, required: true },
    summary: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false },
);

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    statsName: { type: String, trim: true },
    icon: { type: String, default: "fa-book" },
    current: { type: Number, default: 0.0 },
    statusLabel: { type: String, default: "Sin notas" },
    performance: { type: String, default: "Sin notas" },
    cuts: {
      type: [cutSchema],
      default: () => [
        {
          id: 1,
          name: "Corte 1",
          weight: 30,
          activities: [],
          parcial: { grade: 0, weight: 100, locked: true },
          bonus: 0,
        },
        {
          id: 2,
          name: "Corte 2",
          weight: 30,
          activities: [],
          parcial: { grade: 0, weight: 100, locked: true },
          bonus: 0,
        },
        {
          id: 3,
          name: "Corte 3",
          weight: 40,
          activities: [],
          parcial: { grade: 0, weight: 100, locked: true },
          bonus: 0,
        },
      ],
    },
    simulations: { type: [simulationSchema], default: [] },
  },
  { timestamps: true },
);

subjectSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.statsName = ret.statsName || ret.name;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Subject", subjectSchema);
