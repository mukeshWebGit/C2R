import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
  code: String,
  gift: String,
  image: String, // URL or path to gift image
  used: { type: Boolean, default: false },
});
 
export default mongoose.model("PromoCode", promoSchema);

