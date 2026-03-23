import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    role: {
      type: String,
      enum: ["MASTER", "ADMIN"],
      default: "ADMIN",
      required: true,
      index: true,
    },
    name: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);

