import crypto from "crypto";
import express from "express";
import Admin from "../models/Admin.js";
import AdminSession from "../models/AdminSession.js";
import User from "../models/User.js";
import PromoCode from "../models/PromoCode.js";

const router = express.Router();

const getJwtLikeTokenTtlMs = () => {
  const raw = process.env.ADMIN_SESSION_TTL_MS;
  const n = raw ? Number(raw) : NaN;
  // default: 2 hours
  return Number.isFinite(n) && n > 0 ? n : 2 * 60 * 60 * 1000;
};

const hashSha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const hashPassword = (password, salt) => {
  // PBKDF2 (fast but secure enough for admin)
  const iterations = 120000;
  const keyLen = 64;
  const digest = "sha512";
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLen, digest);
  return hash.toString("hex");
};

/** Friendly name for UI: stored `name`, else email local-part, else "Admin". */
const adminDisplayName = (admin) => {
  const n = admin?.name != null ? String(admin.name).trim() : "";
  if (n) return n;
  const email = admin?.email || "";
  const local = email.includes("@") ? email.split("@")[0] : email;
  return local || "Admin";
};

const ensureAdminAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const parts = auth.split(" ");
    const tokenRaw = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : "";

    if (!tokenRaw) {
      return res.status(401).json({ message: "Missing admin auth token." });
    }

    const tokenHash = hashSha256(tokenRaw);
    const session = await AdminSession.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!session) {
      return res.status(401).json({ message: "Admin session expired." });
    }

    const admin = await Admin.findById(session.adminId).lean();
    if (!admin) {
      return res.status(401).json({ message: "Admin not found." });
    }

    req.admin = {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      name: adminDisplayName(admin),
    };
    return next();
  } catch (err) {
    return res.status(500).json({ message: "Admin auth failed." });
  }
};

const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.admin) return res.status(401).json({ message: "Unauthorized." });
  if (!allowedRoles.includes(req.admin.role)) {
    return res.status(403).json({ message: "Forbidden." });
  }
  return next();
};

// POST /api/admin/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const admin = await Admin.findOne({ email: normalizedEmail }).lean();
  if (!admin) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const salt = admin.passwordSalt;
  const computed = hashPassword(String(password), salt);
  if (computed !== admin.passwordHash) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const tokenRaw = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSha256(tokenRaw);
  const expiresAt = new Date(Date.now() + getJwtLikeTokenTtlMs());

  await AdminSession.create({
    adminId: admin._id,
    tokenHash,
    expiresAt,
  });

  return res.json({
    token: tokenRaw,
    role: admin.role,
    email: admin.email,
    name: adminDisplayName(admin),
    expiresAt,
  });
});

// GET /api/admin/me
router.get("/me", ensureAdminAuth, (req, res) => {
  return res.json({ admin: req.admin });
});

// GET /api/admin/dashboard/stats
router.get(
  "/dashboard/stats",
  ensureAdminAuth,
  requireRole(["MASTER", "ADMIN"]),
  async (req, res) => {
    const [totalUsers, usersWithDocs, totalAdmins, totalPromos, usedPromos] =
      await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ "documents.uploadedAt": { $ne: null } }),
        Admin.countDocuments({}),
        PromoCode.countDocuments({}),
        PromoCode.countDocuments({ used: true }),
      ]);

    return res.json({
      totalUsers,
      usersWithDocuments: usersWithDocs,
      totalAdmins,
      totalPromoCodes: totalPromos,
      usedPromoCodes: usedPromos,
    });
  }
);

// USER MANAGEMENT
router.get(
  "/users",
  ensureAdminAuth,
  requireRole(["MASTER", "ADMIN"]),
  async (req, res) => {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ users });
  }
);

router.put(
  "/users/:id",
  ensureAdminAuth,
  requireRole(["MASTER", "ADMIN"]),
  async (req, res) => {
    const { id } = req.params;
    const {
      name,
      email,
      address,
      city,
      state,
      pincode,
      promoCode,
      giftName,
      giftImage,
      documents,
    } = req.body || {};

    const updates = {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(state !== undefined ? { state } : {}),
      ...(pincode !== undefined ? { pincode } : {}),
      ...(promoCode !== undefined ? { promoCode } : {}),
      ...(giftName !== undefined ? { giftName } : {}),
      ...(giftImage !== undefined ? { giftImage } : {}),
      ...(documents !== undefined ? { documents } : {}),
    };

    try {
      const updated = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!updated) return res.status(404).json({ message: "User not found." });
      return res.json({ message: "User updated.", user: updated });
    } catch {
      return res.status(400).json({ message: "Invalid user id." });
    }
  }
);

router.delete(
  "/users/:id",
  ensureAdminAuth,
  requireRole(["MASTER", "ADMIN"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await User.findByIdAndDelete(id);
      if (!result) return res.status(404).json({ message: "User not found." });
      return res.json({ message: "User deleted." });
    } catch {
      return res.status(400).json({ message: "Invalid user id." });
    }
  }
);

// ADMIN MANAGEMENT (MASTER only)
router.get(
  "/admins",
  ensureAdminAuth,
  requireRole(["MASTER"]),
  async (req, res) => {
    const admins = await Admin.find({}).select("email name role createdAt").lean();
    return res.json({
      admins: admins.map((a) => ({
        id: a._id.toString(),
        email: a.email,
        name: adminDisplayName(a),
        role: a.role,
        createdAt: a.createdAt,
      })),
    });
  }
);

router.post(
  "/admins",
  ensureAdminAuth,
  requireRole(["MASTER"]),
  async (req, res) => {
    const { email, password, role, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const trimmedName = name != null ? String(name).trim() : "";

    const newRole = role === "MASTER" ? "MASTER" : "ADMIN"; // default ADMIN, no extra masters
    if (newRole !== "ADMIN") {
      return res.status(400).json({ message: "Only MASTER admin can exist as MASTER." });
    }

    const exists = await Admin.findOne({ email: normalizedEmail }).lean();
    if (exists) return res.status(409).json({ message: "Admin email already exists." });

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(String(password), salt);

    const admin = await Admin.create({
      email: normalizedEmail,
      passwordHash,
      passwordSalt: salt,
      role: "ADMIN",
      ...(trimmedName ? { name: trimmedName } : {}),
    });

    return res.status(201).json({
      message: "Admin created.",
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
        name: adminDisplayName(admin),
      },
    });
  }
);

router.put(
  "/admins/:id/role",
  ensureAdminAuth,
  requireRole(["MASTER"]),
  async (req, res) => {
    const { id } = req.params;
    const { role } = req.body || {};
    const targetRole = role === "ADMIN" ? "ADMIN" : "MASTER";

    const target = await Admin.findById(id);
    if (!target) return res.status(404).json({ message: "Admin not found." });
    if (target.role === "MASTER" && targetRole === "MASTER") {
      return res.status(400).json({ message: "Cannot change MASTER role." });
    }

    // Prevent creating more MASTER admins
    if (targetRole === "MASTER") {
      const masterCount = await Admin.countDocuments({ role: "MASTER" });
      if (masterCount >= 1) {
        return res.status(403).json({ message: "Cannot assign additional MASTER admins." });
      }
    }

    target.role = targetRole;
    await target.save();
    return res.json({
      message: "Role updated.",
      admin: {
        id: target._id.toString(),
        email: target.email,
        role: target.role,
        name: adminDisplayName(target),
      },
    });
  }
);

router.delete(
  "/admins/:id",
  ensureAdminAuth,
  requireRole(["MASTER"]),
  async (req, res) => {
    const { id } = req.params;
    const target = await Admin.findById(id).lean();
    if (!target) return res.status(404).json({ message: "Admin not found." });
    if (target.role === "MASTER") {
      return res.status(403).json({ message: "Cannot delete MASTER admin." });
    }
    await Admin.findByIdAndDelete(id);
    return res.json({ message: "Admin deleted." });
  }
);

// PROMOCODES MANAGEMENT
router.get(
  "/promocodes",
  ensureAdminAuth,
  requireRole(["MASTER", "ADMIN"]),
  async (req, res) => {
    const promocodes = await PromoCode.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ promocodes });
  }
);

router.post(
  "/promocodes",
  ensureAdminAuth,
  requireRole(["MASTER", "ADMIN"]),
  async (req, res) => {
    const { code, gift, image } = req.body || {};
    if (!code || !gift) {
      return res.status(400).json({ message: "code and gift are required." });
    }
    const normalized = String(code).trim().toUpperCase();
    const exists = await PromoCode.findOne({ code: normalized }).lean();
    if (exists) return res.status(409).json({ message: "Promo code already exists." });

    const promo = await PromoCode.create({
      code: normalized,
      gift: String(gift),
      image: image || "",
    });

    return res.status(201).json({ message: "Promo created.", promo });
  }
);

router.put(
  "/promocodes/:id",
  ensureAdminAuth,
  requireRole(["MASTER", "ADMIN"]),
  async (req, res) => {
    const { id } = req.params;
    const { code, gift, image, used } = req.body || {};

    const updates = {};
    if (code !== undefined) updates.code = String(code).trim().toUpperCase();
    if (gift !== undefined) updates.gift = gift;
    if (image !== undefined) updates.image = image;
    if (used !== undefined) updates.used = Boolean(used);

    try {
      const updated = await PromoCode.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!updated) return res.status(404).json({ message: "Promo code not found." });
      return res.json({ message: "Promo updated.", promo: updated });
    } catch {
      return res.status(400).json({ message: "Invalid promo id." });
    }
  }
);

router.delete(
  "/promocodes/:id",
  ensureAdminAuth,
  requireRole(["MASTER", "ADMIN"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await PromoCode.findByIdAndDelete(id);
      if (!result) return res.status(404).json({ message: "Promo code not found." });
      return res.json({ message: "Promo deleted." });
    } catch {
      return res.status(400).json({ message: "Invalid promo id." });
    }
  }
);

export default router;

