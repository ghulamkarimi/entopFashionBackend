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
import { resizeProductImages } from "../middleware/resizeImage";

const productRouter = express.Router();


productRouter.post(
  "/",
  protect,                    
  isAdmin,                      
  upload.array("images", 5),   
  resizeProductImages,          
  createProduct                
);

// Vergiss nicht, das gleiche beim PUT zu machen:
productRouter.put(
  "/:id", 
  protect, 
  isAdmin, 
  upload.array("images", 5), 
  resizeProductImages,          // Hier hat es bei dir im Code noch gefehlt!
  updateProduct
);
productRouter.get("/", getProducts); // GET /api/products
productRouter.delete("/:id", protect, isAdmin, deleteProduct); //  Richtig


export default productRouter;