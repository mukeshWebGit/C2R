import dotenv from "dotenv";
import mongoose from "mongoose";
import PromoCode from "../models/PromoCode.js";
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]); // Use Cloudflare DNS
dotenv.config();

const promoCodes = [
  {
    code: "ABC123",
    gift: "Bluetooth Speaker Mini",
    image: "/images/Bluetooth-Speaker-Mini.webp",
    used: false,
  },
  {
    code: "DEF456",
    gift: "Wireless Headphones",
    image: "/images/Wireless-Headphones.jpg",
    used: false,
  },
  {
    code: "GHI789",
    gift: "Smart Watch",
    image: "/images/Smart-Watch.jpg",
    used: false,
  },
  {
    code: "JKL012",
    gift: "Portable Charger",
    image: "/images/Portable%20Charger.jpg",
    used: false,
  },
  {
    code: "MNO345",
    gift: "Fitness Band",
    image: "/images/Fitness-Band.jpg",
    used: false,
  },
  {
    code: "PQR678",
    gift: "Bluetooth Earbuds",
    image: "/images/Bluetooth-Earbuds.jpg",
    used: false,
  },
  {
    code: "STU901",
    gift: "Travel Backpack",
    image: "/images/Travel-Backpack.jpg",
    used: false,
  },
  {
    code: "VWX234",
    gift: "Gift Voucher ₹500",
    image: "/images/Gift-Voucher-500.webp",
    used: false,
  },
  {
    code: "YZA567",
    gift: "Coffee Mug Set",
    image: "/images/Coffee-Mug-Set.webp",
    used: false,
  },
  {
    code: "BCD890",
    gift: "Desk Lamp",
    image: "/images/Desk-Lamp.webp",
    used: false,
  },
  {
    code: "EFG123",
    gift: "Power Bank 10000mAh",
    image: "/images/Power-Bank-10000mAh.jpg",
    used: false,
  },
  {
    code: "HIJ456",
    gift: "Car Mobile Holder",
    image: "/images/Car-Mobile-Holder.jpg",
    used: false,
  },
  {
    code: "KLM789",
    gift: "Smart Bottle",
    image: "/images/Smart-Bottle.webp",
    used: false,
  },
  {
    code: "NOP012",
    gift: "Travel Pouch",
    image: "/images/Travel-Pouch.jpg",
    used: false,
  },
  {
    code: "QRS345",
    gift: "Wireless Mouse",
    image: "/images/Wireless-Mouse.jpg",
    used: false,
  },
  {
    code: "TUV678",
    gift: "Notebook & Pen Set",
    image: "/images/Notebook-Pen-Set.webp",
    used: false,
  },
  {
    code: "WXY901",
    gift: "Bluetooth Speaker Mini",
    image: "/images/Bluetooth-Speaker-Mini.webp",
    used: false,
  },
  {
    code: "ZAB234",
    gift: "Gift Voucher ₹1000",
    image: "/images/Gift-Voucher-1000.webp",
    used: false,
  },
  {
    code: "CDE567",
    gift: "USB-C Cable",
    image: "/images/USB-C-Cable.jpg",
    used: false,
  },
  {
    code: "FGH890",
    gift: "Phone Stand",
    image: "/images/Phone-Stand.webp",
    used: false,
  },
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

