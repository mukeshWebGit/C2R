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

    // Mark as used on successful verification
    promo.used = true;
    await promo.save();

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

