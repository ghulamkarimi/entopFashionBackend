// models/ProductSchema.ts
import mongoose, { Schema, Document } from "mongoose";
import { IProduct } from "../interface";
import { genderValues } from "../gender";

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: [String], required: true }, // Array von Bild-URLs (z. B. ["/uploads/image1.jpg", "/uploads/image2.jpg"])
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sizes: [{ type: String }], // Optional, falls Größen relevant sind
variants: [
  {
    colorId: {
      type: Schema.Types.ObjectId,
      ref: "Color",
      required: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
],
  weight: { type: Number, required: true, min: 0 }, // Gewicht in Kilogramm (z. B. 1.5)
  createdAt: { type: Date, default: Date.now },
  gender: {
    type: String,
    enum: genderValues,
    required: false,
  },
  brand: { type: String }, // Optional, falls Marken relevant sind
  sku: { type: String, unique: true }, // Eindeutige SKU (Stock Keeping Unit) für das Produkt
  discount: { type: Number, min: 0 }, // Optionaler Rabatt in Prozent
  newPrice: { type: Number }, // Optionaler Rabatt in Prozent
  isFeatured: { type: Boolean, default: false }, // Optional, ob das Produkt hervorgehoben ist
  deliveryTime: { type: String }, // Optional, Lieferzeitangabe (z. B. "2-3 Werktage")
  tags: [{ type: String }], // Optional, Tags für das Produkt (z. B. ["Neu", "Sale"])
  material: { type: String }, // Optional, Materialbeschreibung (z. B. "100% Baumwolle")
  originCountry: { type: String }, // Optional, Herkunftsland des Produkts (z. B. "Deutschland")
});

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
export default Product;
