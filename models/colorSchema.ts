import mongoose, { Schema, Document } from "mongoose";

export interface IColor extends Document {
  name: string;  // z. B. "Blau"
  code: string;  // z. B. "#0000ff"
}

const ColorSchema = new Schema<IColor>({
  name: { type: String, required: true },
  code: { type: String, required: true },
});

export const Color = mongoose.model<IColor>("Color", ColorSchema);
export default Color;
