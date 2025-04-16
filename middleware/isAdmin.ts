import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";

export const isAdmin = asyncHandler((req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user as { isAdmin: boolean }).isAdmin) {
    next();
  } else {
    res.status(403);
    throw new Error("Nur Admins erlaubt");
  }
});
