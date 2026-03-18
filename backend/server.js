// Basic Express server with MongoDB connection

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import PromoCode from "./models/PromoCode.js";
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]); // Use Cloudflare DNS
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static images from backend/images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/images", express.static(path.join(__dirname, "images")));

// Mount routes
app.use("/api/users", userRoutes);

// Public register endpoint: /api/register
app.post("/api/register", async (req, res) => {
  const { mobile, name, email, address, city, state, pincode, promoCode } =
    req.body;

  if (!mobile || !name || !email || !address || !city || !state || !pincode || !promoCode) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const existing = await User.findOne({ mobile });
    if (existing) {
      return res
        .status(400)
        .json({ message: "This mobile number is already registered." });
    }

    const normalizedPromo = promoCode.trim().toUpperCase();
    const promo = await PromoCode.findOne({ code: normalizedPromo }).lean();

    const user = await User.create({
      mobile,
      name,
      email,
      address,
      city,
      state,
      pincode,
      promoCode: normalizedPromo,
      giftName: promo?.gift || "",
      giftImage: promo?.image || "",
    });

    return res
      .status(201)
      .json({ message: "Registered successfully.", userId: user._id });
  } catch (err) {
    console.error("Error registering user:", err.message);
    return res
      .status(500)
      .json({ message: "Server error while registering user." });
  }
});

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();

