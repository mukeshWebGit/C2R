import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
  code: String,
  gift: String,
  used: { type: Boolean, default: false },
});
 
export default mongoose.model("PromoCode", promoSchema);

