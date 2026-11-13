import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, default: "Consulta desde NoteCore", trim: true },
    message: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: ["landing", "dashboard-support"],
      default: "landing",
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
    adminReply: { type: String, default: "", trim: true },
    repliedAt: { type: Date, default: null },
    userReadReply: { type: Boolean, default: false },
  },
  { timestamps: true },
);

contactMessageSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("ContactMessage", contactMessageSchema);
