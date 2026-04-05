import { Request, Response, NextFunction } from "express";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export const resizeNewsletterImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next();
  }

  try {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      return res.status(500).json({ message: "BASE_URL ist nicht gesetzt." });
    }

    const uploadDir = path.resolve("uploadsNewsletter");
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${crypto.randomUUID()}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    await sharp(req.file.buffer)
      .resize(1000, 1000, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    req.body.image = `${baseUrl}/uploadsNewsletter/${fileName}`;
    next();
  } catch (error) {
    next(error);
  }
};