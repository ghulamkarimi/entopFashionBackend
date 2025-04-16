import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "../interface";
import { genderValues } from "../gender";


const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    gender: {
      type: String,
      enum: genderValues,
      required: true,
    },
  },
  { timestamps: true }
);


export const Category = mongoose.model<ICategory>("Category", CategorySchema);
export default Category;
