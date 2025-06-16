import mongoose, { Schema } from "mongoose";
import { ICategory } from "../interface";
import { genderValues } from "../gender";


const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    gender: {
      type: String,
      enum: genderValues,
      required: false,
    },
  },
  { timestamps: true }
);


export const Category = mongoose.model<ICategory>("Category", CategorySchema);
export default Category;
