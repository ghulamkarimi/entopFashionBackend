import mongoose from "mongoose";
import { ICoupon } from "../interface";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Prozent-Rabatt darf nicht > 100 sein
couponSchema.pre("save", function (next) {
  if (this.discountType === "percentage" && this.discountValue > 100) {
    return next(new Error("Prozentualer Rabatt darf nicht größer als 100 sein"));
  }

  if (this.expiryDate && this.expiryDate.getTime() < Date.now()) {
    return next(new Error("Ablaufdatum darf nicht in der Vergangenheit liegen"));
  }

  next();
});

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);

