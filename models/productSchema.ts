// models/ProductSchema.ts
import mongoose, { Schema, Document } from "mongoose";
import { IProduct } from "../interface";

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: [String], required: true }, // Array von Bild-URLs (z. B. ["/uploads/image1.jpg", "/uploads/image2.jpg"])
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  stock: { type: Number, required: true, min: 0 },
  colors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Color" }],
  weight: { type: Number, required: true, min: 0 }, // Gewicht in Kilogramm (z. B. 1.5)
  createdAt: { type: Date, default: Date.now },
});

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
export default Product;