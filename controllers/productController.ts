import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import Product from "../models/productSchema";
import Category from "../models/CategorySchema";
import fs from "fs/promises";
import path from "path";
import Color from "../models/colorSchema";
import { genderValues } from "../gender";

function generateSKU(name: string): string {
  const cleanName = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 7);
  const now = new Date();
  // Datum als YYMMDD
  const year = now.getFullYear().toString().slice(-2); // letzte 2 Stellen vom Jahr
  const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Monat 01-12
  const day = now.getDate().toString().padStart(2, "0"); // Tag 01-31
  const dateString = `${year}${month}${day}`;
  const rand = Math.floor(Math.random() * 90000 + 10000);
  return `${cleanName}-${dateString}-${rand}`;
}

// Produkt erstellen (POST /api/products)
export const createProduct = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.isAdmin) {
        res
          .status(403)
          .json({ message: "Nur Admins dürfen Produkte erstellen" });
        return;
      }

      // Alle möglichen Felder holen
      const {
        name,
        description,
        price,
        category,
        stock,
        sizes,
        colors,
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

      const images = req.body.images || [];

      if (price < 0 || weight < 0 || stock < 0) {
        res.status(400).json({
          message: "Preis, Gewicht und Lagerbestand dürfen nicht negativ sein",
        });
        return;
      }

      // if (!gender) {
      //   res.status(400).json({ message: "Gender ist erforderlich" });
      //   return;
      // }

      // if (!genderValues.includes(gender)) {
      //   res.status(400).json({ message: "Ungültiger Gender-Wert" });
      //   return;
      // }

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
        price > 0 &&
        newPrice < price
      ) {
        discountPercent = Math.round((1 - newPrice / price) * 100);
      }

      // Farben verarbeiten und verknüpfen
      let colorIds: Types.ObjectId[] = [];
      let parsedColors: any[] = [];

      if (colors) {
        if (typeof colors === "string") {
          try {
            parsedColors = JSON.parse(colors);
          } catch (e) {
            parsedColors = [];
          }
        } else if (Array.isArray(colors)) {
          parsedColors = colors.map((c: any) =>
            typeof c === "string" ? JSON.parse(c) : c,
          );
        }
      }

      if (parsedColors.length > 0) {
        for (const color of parsedColors) {
          if (!color.name || !color.hexCode) continue;
          const hexLower = color.hexCode.toLowerCase();
          let existingColor = (await Color.findOne({
            hexCode: hexLower,
          })) as any;

          if (!existingColor) {
            const newColor = new Color({ name: color.name, hexCode: hexLower });
            existingColor = await newColor.save();
          }
          colorIds.push(existingColor._id as Types.ObjectId);
        }
      }

      let productSKU = sku;
      if (!productSKU) {
        productSKU = generateSKU(name);
      }

      // Produkt speichern
      const newProduct = new Product({
        name,
        description,
        price,
        image: images,
        category,
        stock,
        sizes,
        colors: colorIds,
        weight,
        discount: discountPercent,
        brand,
        sku: productSKU,
        newPrice,
        isFeatured,
        deliveryTime,
        tags,
        gender,
        material,
        originCountry,
      });

      await newProduct.save();

      res
        .status(201)
        .json({ message: "Produkt erstellt", product: newProduct });
    } catch (error) {
      res.status(500).json({
        message: "Fehler beim Erstellen des Produkts",
        error: (error as Error).message,
      });
    }
  },
);
// Alle Produkte abrufen (GET /api/products)
export const getProducts = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const products = await Product.find({})
        .populate("category", "name gender")
        .populate("colors", "name hexCode"); // Farben auch anzeigen

      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({
        message: "Fehler beim Abrufen der Produkte",
        error: (error as Error).message,
      });
    }
  },
);

// Produkt aktualisieren (PUT /api/products/:id)

export const updateProduct = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        price,
        category,
        stock,
        sizes,
        colors,
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

      const uploadedImages = req.body.images || [];

      if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({ message: "Ungültige Produkt-ID" });
        return;
      }

      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Produkt nicht gefunden" });
        return;
      }

      if (
        uploadedImages.length > 0 &&
        product.image &&
        Array.isArray(product.image)
      ) {
        for (const oldImg of product.image) {
          const filename = oldImg.split("/").pop();
          if (!filename) continue;

          const filePath = path.resolve("uploads", filename);

          try {
            await fs.unlink(filePath);
          } catch (err) {
            console.warn(` Datei konnte nicht gelöscht werden: ${filePath}`);
          }
        }
      }

      if (category) {
        if (!mongoose.isValidObjectId(category)) {
          res.status(400).json({ message: "Ungültige Kategorie-ID" });
          return;
        }

        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          res.status(404).json({ message: "Kategorie nicht gefunden" });
          return;
        }
      }

      let colorIds: Types.ObjectId[] = [];
      let parsedColors: any[] = [];

      if (colors) {
        if (typeof colors === "string") {
          try {
            parsedColors = JSON.parse(colors);
          } catch {
            parsedColors = [];
          }
        } else if (Array.isArray(colors)) {
          parsedColors = colors.map((c: any) =>
            typeof c === "string" ? JSON.parse(c) : c,
          );
        }
      }

      if (parsedColors.length > 0) {
        for (const color of parsedColors) {
          if (!color.name || !color.hexCode) continue;

          const hexLower = color.hexCode.toLowerCase();
          let existingColor = (await Color.findOne({
            hexCode: hexLower,
          })) as any;

          if (!existingColor) {
            existingColor = await new Color({
              name: color.name,
              hexCode: hexLower,
            }).save();
          }

          colorIds.push(existingColor._id as Types.ObjectId);
        }
      }

      if (price !== undefined && Number(price) < 0) {
        res.status(400).json({ message: "Preis darf nicht negativ sein" });
        return;
      }
      if (gender !== undefined && !genderValues.includes(gender)) {
        res.status(400).json({ message: "Ungültiger Gender-Wert" });
        return;
      }

      if (weight !== undefined && Number(weight) < 0) {
        res.status(400).json({ message: "Gewicht darf nicht negativ sein" });
        return;
      }

      if (stock !== undefined && Number(stock) < 0) {
        res
          .status(400)
          .json({ message: "Lagerbestand darf nicht negativ sein" });
        return;
      }

      product.name = name ?? product.name;
      product.description = description ?? product.description;
      product.price = price !== undefined ? Number(price) : product.price;
      product.gender = gender ?? product.gender;
      product.image =
        uploadedImages.length > 0 ? uploadedImages : product.image;
      product.category = category ?? product.category;
      product.stock = stock !== undefined ? Number(stock) : product.stock;
      product.sizes = sizes ?? product.sizes;
      product.colors = colorIds.length > 0 ? colorIds : product.colors;
      product.weight = weight !== undefined ? Number(weight) : product.weight;
      product.brand = brand ?? product.brand;
      product.sku = sku ?? product.sku;
      product.newPrice =
        newPrice !== undefined ? Number(newPrice) : product.newPrice;
      product.isFeatured =
        isFeatured !== undefined ? isFeatured : product.isFeatured;
      product.deliveryTime = deliveryTime ?? product.deliveryTime;
      product.tags = tags ?? product.tags;
      product.material = material ?? product.material;
      product.originCountry = originCountry ?? product.originCountry;

      if (
        product.price !== undefined &&
        product.newPrice !== undefined &&
        Number(product.price) > 0 &&
        Number(product.newPrice) < Number(product.price)
      ) {
        product.discount = Math.round(
          (1 - Number(product.newPrice) / Number(product.price)) * 100,
        );
      } else {
        product.discount = 0;
      }

      await product.save();

      res.status(200).json({ message: "Produkt aktualisiert", product });
    } catch (error) {
      res.status(500).json({
        message: "Fehler beim Aktualisieren des Produkts",
        error: (error as Error).message,
      });
    }
  }, 
);
// Produkt löschen (DELETE /api/products/:id)


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

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Produkt nicht gefunden" });
      return;
    }

    // Bilder löschen
    if (Array.isArray(product.image)) {
      for (const imgPath of product.image) {
        if (!imgPath.startsWith("/uploads/")) continue;

        const absolutePath = path.resolve(
          "uploads",
          path.basename(imgPath)
        );

        try {
          await fs.unlink(absolutePath);
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            console.warn("Fehler beim Löschen:", err.message);
          }
        }
      }
    }

    // Farben aufräumen
    for (const colorId of product.colors) {
      const otherProduct = await Product.findOne({
        colors: colorId,
        _id: { $ne: product._id },
      });

      if (!otherProduct) {
        await Color.findByIdAndDelete(colorId);
      }
    }

    await product.deleteOne();

    res.status(200).json({ message: "Produkt und Bilder gelöscht" });
  }
);