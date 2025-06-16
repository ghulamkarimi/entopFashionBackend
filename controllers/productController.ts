import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/productSchema";
import Category from "../models/CategorySchema";
 import fs from "fs";
import path from "path";


 

// Produkt erstellen (POST /api/products)
export const createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.isAdmin) {
      res.status(403).json({ message: "Nur Admins dürfen Produkte erstellen" });
      return;
    }

    const { name, description, price, category, stock, colors, weight } = req.body;

    const images = (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`);
    if (!name || !description || price === undefined || !category || stock === undefined || weight === undefined || images.length === 0) {
      res.status(400).json({ message: "Alle erforderlichen Felder müssen ausgefüllt sein, inkl. mindestens einem Bild" });
      return;
    }

    if (price < 0 || weight < 0 || stock < 0) {
      res.status(400).json({ message: "Preis, Gewicht und Lagerbestand dürfen nicht negativ sein" });
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

    let parsedColors: string[] = [];
    if (colors) {
      parsedColors = Array.isArray(colors) ? colors : [colors];
    }

    const newProduct = new Product({
      name,
      description,
      price,
      image: images,
      category,
      stock,
      colors: parsedColors,
      weight,
    });

    await newProduct.save();

    res.status(201).json({ message: "Produkt erstellt", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Erstellen des Produkts", error: (error as Error).message });
  }
});


// Alle Produkte abrufen (GET /api/products)
export const getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({}).populate("category", "name gender");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen der Produkte", error: (error as Error).message });
  }
});

 



export const updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock, colors, weight } = req.body;
    const uploadedImages = (req.files as Express.Multer.File[])?.map(file => `/uploads/${file.filename}`) || [];

    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Ungültige Produkt-ID" });
      return;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Produkt nicht gefunden" });
      return;
    }

    // Falls neue Bilder da sind → alte löschen
    if (uploadedImages.length > 0 && product.image && Array.isArray(product.image)) {
    product.image.forEach(oldImg => {
  const filename = oldImg.split("/").pop(); // Nur Dateiname, z. B. "1748867380651.png"
  const filePath = path.join(process.cwd(), "uploads", filename || "");

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.warn(`⚠️ Fehler beim Löschen der Bilddatei: ${filePath}`, err.message);
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

    // Validierungen
    if (colors && !Array.isArray(colors)) {
      res.status(400).json({ message: "Farben müssen ein Array sein" });
      return;
    }

    if (price !== undefined && price < 0) {
      res.status(400).json({ message: "Preis darf nicht negativ sein" });
      return;
    }
    if (weight !== undefined && weight < 0) {
      res.status(400).json({ message: "Gewicht darf nicht negativ sein" });
      return;
    }
    if (stock !== undefined && stock < 0) {
      res.status(400).json({ message: "Lagerbestand darf nicht negativ sein" });
      return;
    }

    // Felder aktualisieren
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.image = uploadedImages.length > 0 ? uploadedImages : product.image;
    product.category = category || product.category;
    product.stock = stock !== undefined ? stock : product.stock;
    product.colors = colors !== undefined ? colors : product.colors;
    product.weight = weight !== undefined ? weight : product.weight;

    await product.save();

    res.status(200).json({ message: "Produkt aktualisiert", product });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Aktualisieren des Produkts", error: (error as Error).message });
  }
});



// Produkt löschen (DELETE /api/products/:id)
 
 
 

export const deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    const cleanedPath = imgPath.replace(/^\/+/, ""); // entfernt führende /
    const absolutePath = path.join(process.cwd(), "uploads", path.basename(cleanedPath));


    console.log("🧾 Suche Bild:", absolutePath); // Debug

    if (fs.existsSync(absolutePath)) {
      fs.unlink(absolutePath, (err) => {
        if (err) {
          console.warn(`⚠️ Fehler beim Löschen der Bilddatei ${imgPath}:`, err.message);
        }
      });
    } else {
      console.warn(`⚠️ Bild nicht gefunden: ${absolutePath}`);
    }
  }
}

    }

    await product.deleteOne();

    res.status(200).json({ message: "Produkt und Bilder gelöscht" });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Löschen des Produkts", error: (error as Error).message });
  }
});
