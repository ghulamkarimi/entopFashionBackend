import express from "express";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../controllers/categoryController";
import { protect } from "../middleware/protect";
import { isAdmin } from "../middleware/isAdmin";

 

const categoryRouter = express.Router();

categoryRouter.get("/allCategory", getCategories)
categoryRouter.post("/createCategory", protect, isAdmin, createCategory);
categoryRouter.delete("/:id", protect, isAdmin, deleteCategory);
categoryRouter.put("/:id", protect, isAdmin, updateCategory);

export default categoryRouter;
