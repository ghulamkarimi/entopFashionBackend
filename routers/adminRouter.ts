// src/routes/adminRoutes.ts
import { Router } from "express";
 
import { isAdmin } from "../middleware/isAdmin";
import { validateAdminSelfUpdate } from "../middleware/adminValidator";
import { updateMyAdminProfile  } from "../controllers/userController";
import { protect } from "../middleware/protect";

const adminRouter = Router();
adminRouter.put("/profile",protect, isAdmin, validateAdminSelfUpdate, updateMyAdminProfile );
export default adminRouter;
