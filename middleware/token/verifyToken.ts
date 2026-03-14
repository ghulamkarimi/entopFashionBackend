// middleware/token/verifyToken.ts
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import type { AuthUser } from "../../interface";

type RefreshTokenPayload = JwtPayload & AuthUser;

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ message: "Kein RefreshToken vorhanden" });
    return;
  }

  const secret = process.env.REFRESH_TOKEN ?? process.env.REFRESHTOKEN;
  if (!secret) {
    res.status(500).json({ message: "REFRESH_TOKEN fehlt in ENV." });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, secret) as RefreshTokenPayload;
    req.user = decoded; // jetzt korrekt typisiert
    next();
  } catch {
    res.status(403).json({ message: "Ungültiger oder abgelaufener RefreshToken" });
  }
};
