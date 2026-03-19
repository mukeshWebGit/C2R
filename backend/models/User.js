import mongoose from "mongoose";
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]); // Use Cloudflare DNS

const userSchema = new mongoose.Schema({
  mobile: { type: String, unique: true },
  name: String,
  email: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  promoCode: String,
  giftName: String,
  giftImage: String,
  documents: {
    idProof: String,
    invoiceCopy: String,
    scratchCard: String,
    uploadedAt: Date,
  },
});

const User = mongoose.model("User", userSchema);
export default User;