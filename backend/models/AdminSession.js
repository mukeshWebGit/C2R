import mongoose from "mongoose";

const adminSessionSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("AdminSession", adminSessionSchema);

