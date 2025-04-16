import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import User from "../models/userSchema";

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // 1. Entweder aus Header...
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. ...oder aus Cookie
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    res.status(401);
    throw new Error("Kein Token vorhanden");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESSTOKEN!) as { userId: string };

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("Benutzer nicht gefunden – möglicherweise gelöscht");
    }

    req.user = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    res.status(401);
    throw new Error("Token ungültig oder abgelaufen");
  }
});

