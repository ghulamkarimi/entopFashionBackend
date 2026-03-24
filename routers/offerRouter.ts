// routers/offerRouter.ts
import express from "express";
import {
  getSaleProducts,
  applyBulkDiscount,
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  updateCoupon,
  validateCoupon,
} from "../controllers/offerController";

import { isAdmin } from "../middleware/isAdmin";
import { protect } from "../middleware/protect";

const offerRouter = express.Router();

// --- PRODUKT ANGEBOTE ---
offerRouter.get("/sale-products", getSaleProducts);

offerRouter.post(
  "/bulk-discount",
  protect,
  isAdmin,
  applyBulkDiscount
);

// --- COUPONS (ADMIN) ---
offerRouter
  .route("/coupons")
  .get(protect, isAdmin, getAllCoupons)
  .post(protect, isAdmin, createCoupon);

offerRouter
  .route("/coupons/:id")
  .put(protect, isAdmin, updateCoupon)   
  .delete(protect, isAdmin, deleteCoupon);

// --- COUPON VALIDIERUNG (USER / CHECKOUT) ---
offerRouter.post("/coupons/validate", validateCoupon);

export default offerRouter;