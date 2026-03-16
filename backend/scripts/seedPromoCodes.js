import dotenv from "dotenv";
import mongoose from "mongoose";
import PromoCode from "../models/PromoCode.js";
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]); // Use Cloudflare DNS
dotenv.config();

const promoCodes = [
  { code: "ABC123", gift: "Bluetooth Speaker", used: false },
  { code: "DEF456", gift: "Wireless Headphones", used: false },
  { code: "GHI789", gift: "Smart Watch", used: false },
  { code: "JKL012", gift: "Portable Charger", used: false },
  { code: "MNO345", gift: "Fitness Band", used: false },
  { code: "PQR678", gift: "Bluetooth Earbuds", used: false },
  { code: "STU901", gift: "Travel Backpack", used: false },
  { code: "VWX234", gift: "Gift Voucher ₹500", used: false },
  { code: "YZA567", gift: "Coffee Mug Set", used: false },
  { code: "BCD890", gift: "Desk Lamp", used: false },
  { code: "EFG123", gift: "Power Bank 10000mAh", used: false },
  { code: "HIJ456", gift: "Car Mobile Holder", used: false },
  { code: "KLM789", gift: "Smart Bottle", used: false },
  { code: "NOP012", gift: "Travel Pouch", used: false },
  { code: "QRS345", gift: "Wireless Mouse", used: false },
  { code: "TUV678", gift: "Notebook & Pen Set", used: false },
  { code: "WXY901", gift: "Bluetooth Speaker Mini", used: false },
  { code: "ZAB234", gift: "Gift Voucher ₹1000", used: false },
  { code: "CDE567", gift: "USB-C Cable", used: false },
  { code: "FGH890", gift: "Phone Stand", used: false },
];

const seed = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");

    await PromoCode.deleteMany({});
    console.log("Existing promo codes cleared");

    await PromoCode.insertMany(promoCodes);
    console.log("Promo codes inserted:", promoCodes.length);
  } catch (err) {
    console.error("Seeding error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();

