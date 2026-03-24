import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose"; // Import hinzugefügt
import Product from "../models/productSchema";
import { Coupon } from "../models/couponSchema";

// --- PRODUKT ANGEBOTE ---

// 1. Alle Sale-Produkte abrufen
export const getSaleProducts = asyncHandler(async (req: Request, res: Response) => {
  const saleProducts = await Product.find({ 
    newPrice: { $exists: true, $ne: null, $gt: 0 } 
  }).populate("category", "name");
  res.json(saleProducts);
});

// 2. Massen-Rabatt anwenden (Nur einmal definiert!)
export const applyBulkDiscount = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, discountPercentage } = req.body;

  // Check ob ID valide ist
  if (!mongoose.isValidObjectId(categoryId)) {
    res.status(400);
    throw new Error("Ungültige Kategorie-ID");
  }

  const products = await Product.find({ category: categoryId });
  
  if (products.length === 0) {
    res.status(404);
    throw new Error("Keine Produkte in dieser Kategorie gefunden.");
  }

  const updates = products.map(prod => {
    const disc = Number(discountPercentage);
    const salePrice = prod.price * (1 - disc / 100);
    
    prod.newPrice = Math.round(salePrice * 100) / 100;
    prod.discount = disc;
    
    // Fehlerbehebung: 'prod.tags' possibly undefined
    if (!prod.tags) {
      prod.tags = [];
    }
    
    if (!prod.tags.includes("Sale")) {
      prod.tags.push("Sale");
    }
    
    return prod.save();
  });

  await Promise.all(updates);
  res.json({ 
    message: `Erfolg! ${products.length} Produkte wurden um ${discountPercentage}% reduziert.` 
  });
});

// --- COUPON LOGIK ---

// 3. Neuen Coupon erstellen
export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const {
    code,
    discountType,
    discountValue,
    expiryDate,
    minOrderAmount,
    usageLimit,
  } = req.body;

  if (!code || !discountType || discountValue === undefined || !expiryDate) {
    res.status(400);
    throw new Error("Pflichtfelder fehlen");
  }

  const normalizedCode = String(code).trim().toUpperCase();

  const existing = await Coupon.findOne({ code: normalizedCode });
  if (existing) {
    res.status(400);
    throw new Error("Dieser Code existiert bereits");
  }

  const coupon = await Coupon.create({
    code: normalizedCode,
    discountType,
    discountValue: Number(discountValue),
    expiryDate: new Date(expiryDate),
    minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : 0,
    usageLimit:
      usageLimit === null || usageLimit === ""
        ? null
        : Number(usageLimit),
  });

  res.status(201).json(coupon);
});
// 4. Alle Coupons für die Admin-Liste holen
export const getAllCoupons = asyncHandler(async (req: Request, res: Response) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

// 5. Coupon löschen
export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon nicht gefunden");
  }
  await coupon.deleteOne();
  res.json({ message: "Coupon entfernt" });
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const {
    code,
    discountType,
    discountValue,
    expiryDate,
    minOrderAmount,
    usageLimit,
    isActive,
    usedCount,
  } = req.body;

  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Ungültige Coupon-ID");
  }

  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error("Coupon nicht gefunden");
  }

  // Falls Code geändert wird: prüfen, ob schon vergeben
if (code) {
  const normalizedCode = String(code).trim().toUpperCase();

  if (normalizedCode !== coupon.code) {
    const existingCoupon = await Coupon.findOne({
      code: normalizedCode,
      _id: { $ne: coupon._id },
    });

    if (existingCoupon) {
      res.status(400);
      throw new Error("Dieser Code existiert bereits");
    }

    coupon.code = normalizedCode;
  }
}

  if (discountType !== undefined) coupon.discountType = discountType;
  if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
  if (expiryDate !== undefined) coupon.expiryDate = new Date(expiryDate);
  if (minOrderAmount !== undefined) coupon.minOrderAmount = Number(minOrderAmount);
  if (usageLimit !== undefined) {
    coupon.usageLimit = usageLimit === null || usageLimit === ""
      ? null
      : Number(usageLimit);
  }
  if (isActive !== undefined) {
  if (isActive === true || isActive === "true") coupon.isActive = true;
  else if (isActive === false || isActive === "false") coupon.isActive = false;
}
  if (usedCount !== undefined) coupon.usedCount = Number(usedCount);

  await coupon.save();

  res.json({
    message: "Coupon erfolgreich aktualisiert",
    coupon,
  });
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, cartTotal } = req.body;

  if (!code) {
    res.status(400);
    throw new Error("Coupon-Code fehlt");
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const total = Number(cartTotal);

  if (cartTotal === undefined || Number.isNaN(total) || total < 0) {
    res.status(400);
    throw new Error("Ungültiger Warenkorbwert");
  }

  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon) {
    res.status(404);
    throw new Error("Coupon nicht gefunden");
  }

  if (!coupon.isActive) {
    res.status(400);
    throw new Error("Coupon ist deaktiviert");
  }

  if (new Date(coupon.expiryDate) < new Date()) {
    res.status(400);
    throw new Error("Coupon ist abgelaufen");
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error("Coupon wurde bereits maximal oft verwendet");
  }

  if (total < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(
      `Mindestbestellwert nicht erreicht. Mindestens ${coupon.minOrderAmount} erforderlich`
    );
  }

  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = (total * coupon.discountValue) / 100;
  } else {
    discountAmount = Math.min(coupon.discountValue, total);
  }

  const finalTotal = Math.max(total - discountAmount, 0);

  res.status(200).json({
    valid: true,
    coupon,
    discountAmount,
    finalTotal,
  });
});