// middleware/token/verifyToken.ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ message: "Kein RefreshToken vorhanden" });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESHTOKEN!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Ungültiger oder abgelaufener RefreshToken" });
  }
};
