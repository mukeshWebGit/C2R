// Basic Express server with MongoDB connection

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import PromoCode from "./models/PromoCode.js";
import Admin from "./models/Admin.js";
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]); // Use Cloudflare DNS
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static images from backend/images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

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

    // Ensure MASTER admin exists (created from .env on first run)
    const masterEmail = process.env.MASTER_ADMIN_EMAIL;
    const masterPassword = process.env.MASTER_ADMIN_PASSWORD;

    if (masterEmail && masterPassword) {
      const normalizedEmail = String(masterEmail).trim().toLowerCase();
      const existing = await Admin.findOne({ email: normalizedEmail }).lean();
      const envName = String(process.env.MASTER_ADMIN_NAME || "").trim();
      const defaultName =
        envName || (normalizedEmail.includes("@") ? normalizedEmail.split("@")[0] : normalizedEmail);

      if (!existing) {
        const salt = crypto.randomBytes(16).toString("hex");
        const iterations = 120000;
        const keyLen = 64;
        const digest = "sha512";
        const passwordHash = crypto
          .pbkdf2Sync(String(masterPassword), salt, iterations, keyLen, digest)
          .toString("hex");

        await Admin.create({
          email: normalizedEmail,
          passwordHash,
          passwordSalt: salt,
          role: "MASTER",
          name: defaultName,
        });
        console.log("✅ Created MASTER admin");
      } else if (!String(existing.name || "").trim() && defaultName) {
        await Admin.updateOne(
          { _id: existing._id },
          { $set: { name: defaultName } }
        );
        console.log("✅ Set MASTER admin display name from env / email");
      }
    } else {
      console.warn("⚠️ MASTER_ADMIN_EMAIL / MASTER_ADMIN_PASSWORD not set in .env");
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();

