import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "../interface";

export interface IUserDocument extends IUser, mongoose.Document {
  isPasswordMatch(enteredPassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, unique: true, required: true },
    password:  { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isAdmin:    { type: Boolean, default: false },
    customerNumber: { type: String, unique: true },
    isGuest: { type: Boolean, default: false },
    accessToken: { type: String },
    refreshToken: { type: String },

    // 🆕 Optional gespeicherte Adresse
    defaultAddress: {
      fullName: { type: String },
      street:   { type: String },
      houseNumber: { type: String },
      city:     { type: String },
      zip:      { type: String },
      country:  { type: String },
      phone:    { type: String },
    },
  },
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordMatch = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model<IUserDocument>("User", userSchema);
export default User;
