import express from "express";
import PromoCode from "../models/PromoCode.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Verify activation / promo code
router.post("/verify-code", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Code is required." });
  }

  try {
    const normalized = code.trim().toUpperCase();
    const promo = await PromoCode.findOne({ code: normalized });

    if (!promo) {
      return res.status(404).json({ message: "Invalid code." });
    }

    if (promo.used) {
      return res
        .status(400)
        .json({ message: "This promotional code has already been used." });
    }

    // Mark as used on successful verification
    promo.used = true;
    await promo.save();

    return res.json({
      message: "Code verified.",
      gift: promo.gift,
    });
  } catch (err) {
    console.error("Error verifying code:", err.message);
    return res
      .status(500)
      .json({ message: "Server error while verifying code." });
  }
});

// Save user personal details
router.post("/save-user", async (req, res) => {
  const {
    mobile,
    name,
    address,
    city,
    state,
    pincode,
    promoCode,
    giftName,
  } = req.body;

  if (!mobile || !name || !address || !city || !state || !pincode) {
    return res.status(400).json({ message: "All personal details are required." });
  }

  try {
    const user = await User.create({
      mobile,
      name,
      address,
      city,
      state,
      pincode,
      promoCode,
      giftName,
    });

    return res.status(201).json({ message: "User saved successfully.", userId: user._id });
  } catch (err) {
    console.error("Error saving user:", err.message);
    return res
      .status(500)
      .json({ message: "Server error while saving user details." });
  }
});

// Check if mobile already used
router.post("/check-mobile", async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required." });
  }

  try {
    const exists = await User.exists({ mobile });
    return res.json({ exists: !!exists });
  } catch (err) {
    console.error("Error checking mobile:", err.message);
    return res
      .status(500)
      .json({ message: "Server error while checking mobile." });
  }
});

export default router;

