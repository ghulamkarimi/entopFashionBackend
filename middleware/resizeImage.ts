import { Request, Response, NextFunction } from "express";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export const resizeProductImages = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log("1. Middleware erreicht!");

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return next();
    }
    const files = req.files as Express.Multer.File[];
    req.body.images = [];

    try {
        const uploadDir = path.resolve("uploads");
        await fs.mkdir(uploadDir, { recursive: true });

        for (const file of files) {
            const fileName = crypto.randomUUID() + ".webp";
            const filePath = path.resolve(uploadDir, fileName);

            await sharp(file.buffer)
                .resize(1000, 1000, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .webp({ quality: 80 })
                .toFile(filePath);

            req.body.images.push(`/uploads/${fileName}`);
        }
        next();
    } catch (error) {
        next(error);
    }
};