import express from "express";
import PromoCode from "../models/PromoCode.js";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads", "documents");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "-");
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only PDF, JPG, or PNG files are allowed."));
  },
});

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.post(
  "/upload-documents",
  upload.fields([
    { name: "id_proof", maxCount: 1 },
    { name: "invoice_copy", maxCount: 1 },
    { name: "scratch_card", maxCount: 1 },
  ]),
  async (req, res) => {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required." });
    }

    const idProof = req.files?.id_proof?.[0];
    const invoiceCopy = req.files?.invoice_copy?.[0];
    const scratchCard = req.files?.scratch_card?.[0];

    if (!idProof || !invoiceCopy || !scratchCard) {
      return res
        .status(400)
        .json({ message: "Please upload all required documents." });
    }

    try {
      const user = await User.findOne({ mobile });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      user.documents = {
        idProof: `/uploads/documents/${idProof.filename}`,
        invoiceCopy: `/uploads/documents/${invoiceCopy.filename}`,
        scratchCard: `/uploads/documents/${scratchCard.filename}`,
        uploadedAt: new Date(),
      };
      await user.save();

      return res.json({
        message: "Documents uploaded successfully.",
        documents: user.documents,
      });
    } catch (err) {
      console.error("Error uploading documents:", err.message);
      return res
        .status(500)
        .json({ message: "Server error while uploading documents." });
    }
  }
);

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

    return res.json({
      message: "Code verified.",
      gift: promo.gift,
      image: promo.image || "",
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
    const normalizedPromo = String(promoCode || "").trim().toUpperCase();
    let promo = null;
    if (normalizedPromo) {
      promo = await PromoCode.findOneAndUpdate(
        { code: normalizedPromo, used: false },
        { $set: { used: true } },
        { new: true }
      ).lean();
      if (!promo) {
        return res
          .status(400)
          .json({ message: "Invalid or already used promotional code." });
      }
    }

    const user = await User.create({
      mobile,
      name,
      address,
      city,
      state,
      pincode,
      promoCode: normalizedPromo,
      giftName: giftName || promo?.gift || "",
      giftImage: promo?.image || "",
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

// Mark scratch completed for a user
router.post("/flow/scratch-complete", async (req, res) => {
  const { mobile } = req.body || {};
  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required." });
  }
  try {
    const user = await User.findOneAndUpdate(
      { mobile },
      {
        $set: {
          "flow.scratchCompletedAt": new Date(),
        },
      },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({
      message: "Scratch completion saved.",
      scratchCompletedAt: user.flow?.scratchCompletedAt || null,
    });
  } catch (err) {
    console.error("Error saving scratch flow:", err.message);
    return res
      .status(500)
      .json({ message: "Server error while saving scratch status." });
  }
});

// Initialize/read activation timer in DB (persists across refresh/close)
router.post("/flow/activation-init", async (req, res) => {
  const { mobile, durationMs } = req.body || {};
  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required." });
  }
  const duration = Number.isFinite(Number(durationMs)) && Number(durationMs) > 0
    ? Number(durationMs)
    : 60 * 1000;
  try {
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found." });

    const now = Date.now();
    const currentEnd = user.flow?.activationEndsAt
      ? new Date(user.flow.activationEndsAt).getTime()
      : NaN;
    const hasValidFutureEnd = Number.isFinite(currentEnd) && currentEnd > now;
    const isCompleted = Boolean(user.flow?.activationCompletedAt);

    if (!hasValidFutureEnd && !isCompleted) {
      user.flow = {
        ...(user.flow || {}),
        activationEndsAt: new Date(now + duration),
      };
      await user.save();
    }

    return res.json({
      activationEndsAt: user.flow?.activationEndsAt || null,
      activationCompletedAt: user.flow?.activationCompletedAt || null,
    });
  } catch (err) {
    console.error("Error initializing activation flow:", err.message);
    return res
      .status(500)
      .json({ message: "Server error while initializing activation timer." });
  }
});

// Mark activation timer completed
router.post("/flow/activation-complete", async (req, res) => {
  const { mobile } = req.body || {};
  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required." });
  }
  try {
    const user = await User.findOneAndUpdate(
      { mobile },
      {
        $set: {
          "flow.activationCompletedAt": new Date(),
        },
        $unset: {
          "flow.activationEndsAt": 1,
        },
      },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({
      message: "Activation completion saved.",
      activationCompletedAt: user.flow?.activationCompletedAt || null,
    });
  } catch (err) {
    console.error("Error saving activation completion:", err.message);
    return res
      .status(500)
      .json({ message: "Server error while saving activation completion." });
  }
});

// Get user details (and gift) by mobile
router.get("/details", async (req, res) => {
  const { mobile } = req.query;

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required." });
  }

  try {
    const user = await User.findOne({ mobile }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let giftName = user.giftName || null;
    let giftImage = user.giftImage || null;
    if (user.promoCode) {
      const promo = await PromoCode.findOne({
        code: user.promoCode.toUpperCase(),
      }).lean();
      if (!giftName) giftName = promo?.gift || null;
      if (!giftImage) giftImage = promo?.image || null;
    }

    return res.json({
      mobile: user.mobile,
      name: user.name,
      email: user.email || "",
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      promoCode: user.promoCode || "",
      giftName,
      giftImage,
      documents: {
        idProof: user.documents?.idProof || "",
        invoiceCopy: user.documents?.invoiceCopy || "",
        scratchCard: user.documents?.scratchCard || "",
        uploadedAt: user.documents?.uploadedAt || null,
      },
      flow: {
        scratchCompletedAt: user.flow?.scratchCompletedAt || null,
        activationEndsAt: user.flow?.activationEndsAt || null,
        activationCompletedAt: user.flow?.activationCompletedAt || null,
      },
    });
  } catch (err) {
    console.error("Error fetching user details:", err.message);
    return res
      .status(500)
      .json({ message: "Server error while fetching user details." });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Each file must be up to 1MB." });
    }
    return res.status(400).json({ message: err.message || "Upload error." });
  }

  if (err?.message?.includes("Only PDF, JPG, or PNG")) {
    return res.status(400).json({ message: err.message });
  }

  return next(err);
});

export default router;

