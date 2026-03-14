import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import Product from "../models/productSchema";
import Category from "../models/CategorySchema";
import fs from "fs";
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
        material,
        originCountry,
      } = req.body;


  
      const images =
        Array.isArray(req.files) && req.files.length > 0
          ? (req.files as Express.Multer.File[]).map(
              (file) => `/uploads/${file.filename}`
            )
          : [];

      if (
        !name ||
        !description ||
        price === undefined ||
        !category ||
        stock === undefined ||
        weight === undefined ||
        images.length === 0
      ) {
        res.status(400).json({
          message:
            "Alle erforderlichen Felder müssen ausgefüllt sein, inkl. mindestens einem Bild",
        });
        return;
      }

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
            typeof c === "string" ? JSON.parse(c) : c
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
        sku :productSKU,
        newPrice,
        isFeatured,
        deliveryTime,
        tags,
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
  }
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
  }
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
        material,
        originCountry,
      } = req.body;
      const uploadedImages =
        Array.isArray(req.files) && req.files.length > 0
          ? (req.files as Express.Multer.File[]).map(
              (file) => `/uploads/${file.filename}`
            )
          : [];

      if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({ message: "Ungültige Produkt-ID" });
        return;
      }

      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Produkt nicht gefunden" });
        return;
      }

      // Alte Bilder löschen, wenn neue hochgeladen wurden
      if (
        uploadedImages.length > 0 &&
        product.image &&
        Array.isArray(product.image)
      ) {
        product.image.forEach((oldImg) => {
          const filename = oldImg.split("/").pop();
          const filePath = path.join(process.cwd(), "uploads", filename || "");
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.warn(
                  `⚠️ Fehler beim Löschen der Bilddatei: ${filePath}`,
                  err.message
                );
              }
            });
          } else {
            console.warn(`⚠️ Bild existiert nicht: ${filePath}`);
          }
        });
      }

      // Kategorie prüfen
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

      // Farben prüfen und ggf. erstellen wie bei createProduct
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
            typeof c === "string" ? JSON.parse(c) : c
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

      // Validierungen
      if (price !== undefined && price < 0) {
        res.status(400).json({ message: "Preis darf nicht negativ sein" });
        return;
      }
      if (weight !== undefined && weight < 0) {
        res.status(400).json({ message: "Gewicht darf nicht negativ sein" });
        return;
      }
      if (stock !== undefined && stock < 0) {
        res
          .status(400)
          .json({ message: "Lagerbestand darf nicht negativ sein" });
        return;
      }

      // Felder aktualisieren
      product.name = name ?? product.name;
      product.description = description ?? product.description;
      product.price = price !== undefined ? price : product.price;
      product.image =
        uploadedImages.length > 0 ? uploadedImages : product.image;
      product.category = category ?? product.category;
      product.stock = stock !== undefined ? stock : product.stock;
      product.sizes = sizes ?? product.sizes;
      product.colors = colorIds.length > 0 ? colorIds : product.colors;
      product.weight = weight !== undefined ? weight : product.weight;
      product.brand = brand ?? product.brand;
      product.sku = sku ?? product.sku;
      product.newPrice = newPrice !== undefined ? newPrice : product.newPrice;
      product.isFeatured =
        isFeatured !== undefined ? isFeatured : product.isFeatured;
      product.deliveryTime = deliveryTime ?? product.deliveryTime;
      product.tags = tags ?? product.tags;
      product.material = material ?? product.material;
      product.originCountry = originCountry ?? product.originCountry;

      // Rabatt automatisch berechnen nach Aktualisierung von price/newPrice
      if (
        product.price !== undefined &&
        product.newPrice !== undefined &&
        product.price.valueOf() > 0 &&
        product.newPrice.valueOf() < product.price.valueOf()
      ) {
        product.discount = Math.round(
          (1 - Number(product.newPrice) / Number(product.price)) * 100
        );
      } else if (
        product.price !== undefined &&
        product.newPrice !== undefined &&
        (product.newPrice >= product.price || product.price === 0)
      ) {
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
  }
);

// Produkt löschen (DELETE /api/products/:id)
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
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

      // 🧹 Bilder löschen
      if (product.image && Array.isArray(product.image)) {
        for (const imgPath of product.image) {
          if (imgPath.startsWith("/uploads/")) {
            const cleanedPath = imgPath.replace(/^\/+/g, "");
            const absolutePath = path.join(
              process.cwd(),
              "uploads",
              path.basename(cleanedPath)
            );

            console.log("🧾 Suche Bild:", absolutePath);

            if (fs.existsSync(absolutePath)) {
              fs.unlink(absolutePath, (err) => {
                if (err) {
                  console.warn(
                    `⚠️ Fehler beim Löschen der Bilddatei ${imgPath}:`,
                    err.message
                  );
                }
              });
            } else {
              console.warn(`⚠️ Bild nicht gefunden: ${absolutePath}`);
            }
          }
        }
      }
      const colorIds = product.colors.map((id) => id.toString());

      for (const colorId of colorIds) {
        const otherProduct = await Product.findOne({ colors: colorId });
        if (!otherProduct) {
          // Wenn die Farbe in keinem anderen Produkt mehr verwendet wird: Löschen!
          await Color.findByIdAndDelete(colorId);
        }
      }

      await product.deleteOne();

      res.status(200).json({ message: "Produkt und Bilder gelöscht" });
    } catch (error) {
      res.status(500).json({
        message: "Fehler beim Löschen des Produkts",
        error: (error as Error).message,
      });
    }
  }
);
