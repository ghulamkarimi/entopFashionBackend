import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import Product from "../models/productSchema";
import Category from "../models/categorySchema";
import fs from "fs/promises";
import path from "path";
import Color from "../models/colorSchema";
import { IProduct } from "../interface";

function generateSKU(name: string): string {
  const cleanName = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 7);

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const dateString = `${year}${month}${day}`;
  const rand = Math.floor(Math.random() * 90000 + 10000);

  return `${cleanName}-${dateString}-${rand}`;
}

type VariantInput = {
  colorId?: string;
  hexCode?: string;
  name?: string;
  size?: string;
  quantity?: number | string;
  price?: number | string;
  sold?: number | string;
};

type VariantData = {
  colorId: Types.ObjectId;
  size: string;
  quantity: number;
  price: number;
  sold: number;
};

async function buildVariantData(
  variants: VariantInput[],
  fallbackPrice: number,
): Promise<VariantData[]> {
  const variantData: VariantData[] = [];

  for (const variant of variants) {
    let existingColor = null;

    if (variant.colorId && mongoose.isValidObjectId(variant.colorId)) {
      existingColor = await Color.findById(variant.colorId);
    }

    if (!existingColor && variant.hexCode) {
      const hexLower = String(variant.hexCode).toLowerCase().trim();

      existingColor = await Color.findOne({ hexCode: hexLower });

      if (!existingColor) {
        existingColor = await new Color({
          name: variant.name?.trim() || "Unbekannt",
          hexCode: hexLower,
        }).save();
      }
    }

    if (!existingColor) {
      throw new Error("Farbe konnte nicht gefunden oder erstellt werden");
    }

    const size = String(variant.size || "").trim() || "Standard";

    const finalVariantPrice =
      variant.price !== undefined &&
        variant.price !== null &&
        variant.price !== ""
        ? Number(variant.price)
        : Number(fallbackPrice);

    if (Number.isNaN(finalVariantPrice) || finalVariantPrice < 0) {
      throw new Error("Variantenpreis ist ungültig");
    }

    const quantity = Number(variant.quantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      throw new Error("Variantenbestand ist ungültig");
    }

    const sold = Number(variant.sold ?? 0);
    if (Number.isNaN(sold) || sold < 0) {
      throw new Error("Verkaufsmenge ist ungültig");
    }

    variantData.push({
      colorId: existingColor._id as Types.ObjectId,
      size,
      quantity,
      price: finalVariantPrice,
      sold,
    });
  }

  return variantData;
}

function validateUniqueVariants(variants: VariantData[]) {
  const seen = new Set<string>();

  for (const variant of variants) {
    const key = `${String(variant.colorId)}-${variant.size.toLowerCase().trim()}`;
    if (seen.has(key)) {
      throw new Error(`Doppelte Variante gefunden: ${variant.size}`);
    }
    seen.add(key);
  }
}

// Produkt erstellen
export const createProduct = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.isAdmin) {
        res
          .status(403)
          .json({ message: "Nur Admins dürfen Produkte erstellen" });
        return;
      }

      const {
        name,
        description,
        price,
        category,
        variants,
        weight,
        brand,
        sku,
        newPrice,
        isFeatured,
        deliveryTime,
        tags,
        gender,
        material,
        originCountry,
      } = req.body;

      const uploadedFiles = Array.isArray(req.files) ? req.files : [];
      const images = uploadedFiles.map(
        (file: Express.Multer.File) => `/uploads/${file.filename}`,
      );

      if (Number(price) < 0 || Number(weight) < 0) {
        res.status(400).json({
          message: "Preis und Gewicht dürfen nicht negativ sein",
        });
        return;
      }

      if (!mongoose.isValidObjectId(category)) {
        res.status(400).json({ message: "Ungültige Kategorie-ID" });
        return;
      }

      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        res.status(404).json({ message: "Kategorie nicht gefunden" });
        return;
      }

      let discountPercent: number | undefined = undefined;
      if (
        price !== undefined &&
        newPrice !== undefined &&
        Number(price) > 0 &&
        Number(newPrice) < Number(price)
      ) {
        discountPercent = Math.round(
          (1 - Number(newPrice) / Number(price)) * 100,
        );
      }

      const parsedVariants: VariantInput[] =
        variants && typeof variants === "string"
          ? JSON.parse(variants)
          : Array.isArray(variants)
            ? variants
            : [];

      const variantData = await buildVariantData(parsedVariants, Number(price));
      validateUniqueVariants(variantData);

      const totalStock = variantData.reduce(
        (acc, curr) => acc + curr.quantity,
        0,
      );
           const parsedTags =
  tags && typeof tags === "string"
    ? JSON.parse(tags)
    : Array.isArray(tags)
      ? tags
      : [];
      const parsedIsFeatured =
        isFeatured === true || String(isFeatured).toLowerCase() === "true";
      let productSKU = sku;
      if (!productSKU) {
        productSKU = generateSKU(name);
      }
   
      const newProduct = new Product({
        name,
        description,
        price: Number(price),
        image: images,
        category,
        stock: totalStock,
        variants: variantData,
        weight: Number(weight),
        discount: discountPercent ?? 0,
        brand,
        sku: productSKU,
        newPrice:
          newPrice !== undefined && newPrice !== null && newPrice !== ""
            ? Number(newPrice)
            : undefined,
        isFeatured: parsedIsFeatured,
        deliveryTime,
        tags: parsedTags,
        gender,
        material,
        originCountry,
      });

      await newProduct.save();

      res.status(201).json({
        message: "Produkt erstellt",
        product: newProduct,
      });
    } catch (error) {
      const message = (error as Error).message;

      const isValidationError =
        message.includes("Variante") ||
        message.includes("Größe") ||
        message.includes("Farbe") ||
        message.includes("Preis") ||
        message.includes("Bestand") ||
        message.includes("Verkaufsmenge") ||
        message.includes("Doppelte");

      res.status(isValidationError ? 400 : 500).json({
        message: isValidationError
          ? message
          : "Fehler beim Erstellen des Produkts",
        error: message,
      });
    }
  },
);

// Alle Produkte abrufen
export const getProducts = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const products = await Product.find({})
        .populate("category", "name gender")
        .populate("variants.colorId", "name hexCode");

      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({
        message: "Fehler beim Abrufen der Produkte",
        error: (error as Error).message,
      });
    }
  },
);

// Produkt aktualisieren
export const updateProduct = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { variants, price, newPrice, category, stock, ...otherData } =
        req.body;

      const uploadedFiles = Array.isArray(req.files) ? req.files : [];
      const images = uploadedFiles.map(
        (file: Express.Multer.File) => `/uploads/${file.filename}`,
      );

      if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({ message: "Ungültige Produkt-ID" });
        return;
      }

      const product = (await Product.findById(
        req.params.id,
      )) as IProduct | null;
      if (!product) {
        res.status(404).json({ message: "Produkt nicht gefunden" });
        return;
      }

      const oldImages = Array.isArray(product.image) ? [...product.image] : [];

      if (variants) {
        const parsedVariants: VariantInput[] =
          typeof variants === "string" ? JSON.parse(variants) : variants;

        const variantData = await buildVariantData(
          parsedVariants,
          Number(price ?? product.price),
        );
        validateUniqueVariants(variantData);

        product.variants = variantData;
        product.stock = variantData.reduce(
          (acc, curr) => acc + curr.quantity,
          0,
        );
      }

      Object.assign(product, otherData);

      if (category) product.category = category;
      if (price !== undefined) product.price = Number(price);
      if (newPrice !== undefined) {
        product.newPrice =
          newPrice !== null && newPrice !== "" ? Number(newPrice) : undefined;
      }

      if (images.length > 0) {
        product.image = images;
      }

      const pPrice = Number(product.price);
      const pNewPrice =
        product.newPrice !== undefined ? Number(product.newPrice) : null;

      if (pPrice > 0 && pNewPrice !== null && pNewPrice < pPrice) {
        product.discount = Math.round((1 - pNewPrice / pPrice) * 100);
      } else {
        product.discount = 0;
      }

      await product.save();

      if (images.length > 0) {
        const imagesToDelete = oldImages.filter(
          (oldImg) => !images.includes(oldImg),
        );

        for (const oldImg of imagesToDelete) {
          const filename = oldImg.split("/").pop();
          if (!filename) continue;

          const filePath = path.resolve("uploads", filename);

          try {
            await fs.unlink(filePath);
          } catch (err) {
            console.warn(`Löschen fehlgeschlagen: ${filePath}`);
          }
        }
      }

      res.status(200).json({
        message: "Produkt aktualisiert",
        product,
      });
    } catch (error) {
      res.status(500).json({
        message: "Fehler beim Aktualisieren",
        error: (error as Error).message,
      });
    }
  },
);

// Produkt löschen
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Ungültige Produkt-ID" });
      return;
    }

    if (!req.user?.isAdmin) {
      res.status(403).json({ message: "Nur Admins dürfen Produkte löschen" });
      return;
    }

    const product = (await Product.findById(req.params.id)) as IProduct | null;
    if (!product) {
      res.status(404).json({ message: "Produkt nicht gefunden" });
      return;
    }

    const oldImages = Array.isArray(product.image) ? [...product.image] : [];
    const colorIds = (product.variants || []).map((v) => v.colorId);

    await product.deleteOne();

    for (const imgPath of oldImages) {
      if (!imgPath.startsWith("/uploads/")) continue;

      const filename = path.basename(imgPath);
      const absolutePath = path.join(process.cwd(), "uploads", filename);

      try {
        await fs.unlink(absolutePath);
      } catch (err: any) {
        if (err.code !== "ENOENT") {
          console.warn("Fehler beim Löschen:", err.message);
        }
      }
    }

    const usedColors = await Product.find({
      "variants.colorId": { $in: colorIds },
    }).distinct("variants.colorId");

    const colorsToDelete = colorIds.filter(
      (id: any) => !usedColors.some((used: any) => used.equals(id)),
    );

    if (colorsToDelete.length > 0) {
      await Color.deleteMany({ _id: { $in: colorsToDelete } });
    }

    res.status(200).json({ message: "Produkt und Bilder gelöscht" });
  },
);
