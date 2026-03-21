import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import User from "../models/userSchema";

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    res.status(401);
    throw new Error("Kein Token vorhanden");
  }

  const accessSecret = process.env.ACCESS_TOKEN;
  if (!accessSecret) {
    res.status(500);
    throw new Error("ACCESS_TOKEN fehlt in ENV");
  }

  try {
    const decoded = jwt.verify(token, accessSecret) as { userId?: string };

    if (!decoded.userId) {
      res.status(401);
      throw new Error("Token enthält keine userId");
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("Benutzer nicht gefunden - möglicherweise gelöscht");
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
 } catch (error: any) {
  console.log("JWT verify error:", error?.name, error?.message);
  res.status(401);
  throw new Error(error?.name === "TokenExpiredError" ? "Token abgelaufen" : "Token ungültig");
}

});
