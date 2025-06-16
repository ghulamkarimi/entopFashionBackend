import express from "express";
import {
  createProduct,
  getProducts, 
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { isAdmin } from "../middleware/isAdmin";
import { protect } from "../middleware/protect";
import upload from "../middleware/upload";

const productRouter = express.Router();


productRouter.post("/", protect, isAdmin, upload.array("images", 5), createProduct);
productRouter.get("/", getProducts); // GET /api/products
productRouter.put("/:id", protect, isAdmin, upload.array("images", 5), updateProduct);
productRouter.delete("/:id", protect, isAdmin, deleteProduct); // ✅ Richtig


export default productRouter;