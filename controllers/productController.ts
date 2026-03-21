import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import Product from "../models/productSchema";
import Category from "../models/CategorySchema";
import fs from "fs/promises";
import path from "path";
import Color from "../models/colorSchema";


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
      let colorData: { colorId: Types.ObjectId; quantity: number; price:number }[] = [];
      let parsedColors: any[] = [];

      if (colors) {
        parsedColors = typeof colors === "string" ? JSON.parse(colors) : colors;
      }

      if (parsedColors.length > 0) {
        for (const color of parsedColors) {
          if (!color.hexCode) continue;

          const hexLower = color.hexCode.toLowerCase();
          let existingColor = await Color.findOne({ hexCode: hexLower });

          if (!existingColor) {
            existingColor = await new Color({
              name: color.name || "Unbekannt",
              hexCode: hexLower,
            }).save();
          }

          const finalColorPrice = (color.price !== undefined && color.price !== null) 
    ? Number(color.price) 
    : Number(price);

          colorData.push({
            colorId: existingColor._id as Types.ObjectId,
            quantity: Number(color.quantity) || 0, // Hier ziehen wir die Menge pro Farbe
            price: finalColorPrice, // Hier ziehen wir den Preis pro Farbe oder verwenden den Standardpreis
          });
        }
      }

      // Gesamtbestand automatisch berechnen
      const totalStock = colorData.reduce(
        (acc, curr) => acc + curr.quantity,
        0,
      );

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
        stock: totalStock,
        sizes,
        colors: colorData,
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
      const { colors, price, newPrice, category, stock, ...otherData } =
        req.body;
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

      // --- BILDER LÖSCHEN (Logik wie gehabt) ---
      if (
        uploadedImages.length > 0 &&
        product.image &&
        Array.isArray(product.image)
      ) {
        for (const oldImg of product.image) {
          const filename = oldImg.split("/").pop();
          if (filename) {
            const filePath = path.resolve("uploads", filename);
            try {
              await fs.unlink(filePath);
            } catch (err) {
              console.warn("Löschen fehlgeschlagen");
            }
          }
        }
      }

      // --- FARBEN & QUANTITY VERARBEITUNG ---
if (colors) {
  const parsedColors =
    typeof colors === "string" ? JSON.parse(colors) : colors;

  let colorData: { colorId: Types.ObjectId; quantity: number; price: number }[] = [];

  for (const color of parsedColors) {
    let existingColor = null;

    // Fall 1: colorId wurde direkt geschickt
    if (color.colorId && mongoose.isValidObjectId(color.colorId)) {
      existingColor = await Color.findById(color.colorId);
    }

    // Fall 2: hexCode wurde geschickt
    if (!existingColor && color.hexCode) {
      const hexLower = String(color.hexCode).toLowerCase();

      existingColor = await Color.findOne({ hexCode: hexLower });

      if (!existingColor) {
        existingColor = await new Color({
          name: color.name || "Unbekannt",
          hexCode: hexLower,
        }).save();
      }
    }

    if (!existingColor) continue;

    const finalColorPrice =
      color.price !== undefined && color.price !== null
        ? Number(color.price)
        : Number(price ?? product.price);

    colorData.push({
      colorId: existingColor._id as Types.ObjectId,
      quantity: Number(color.quantity) || 0,
      price: finalColorPrice,
    });
  }

  product.colors = colorData as any;
  product.stock = colorData.reduce((acc, curr) => acc + curr.quantity, 0);
}
      else if (stock !== undefined) {
        // Fallback: Falls keine Farben geschickt werden, aber ein Stock-Wert
        product.stock = Number(stock);
      }

      // --- RESTLICHE FELDER AKTUALISIEREN ---
      Object.assign(product, otherData);

      if (category) product.category = category;
      if (price !== undefined) product.price = Number(price);
      if (newPrice !== undefined) product.newPrice = Number(newPrice);
      if (uploadedImages.length > 0) product.image = uploadedImages;

      // --- DISCOUNT BERECHNUNG ---
      const pPrice = Number(product.price);
      const pNewPrice =
        product.newPrice !== undefined ? Number(product.newPrice) : null;

      if (pPrice > 0 && pNewPrice !== null && pNewPrice < pPrice) {
        product.discount = Math.round((1 - pNewPrice / pPrice) * 100);
      } else {
        product.discount = 0;
      }

      await product.save();
      res.status(200).json({ message: "Produkt aktualisiert", product });
    } catch (error) {
      res.status(500).json({
        message: "Fehler beim Aktualisieren",
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

        const absolutePath = path.resolve("uploads", path.basename(imgPath));

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
  },
);
