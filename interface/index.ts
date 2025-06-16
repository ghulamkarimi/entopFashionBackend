import mongoose from "mongoose";
import { GenderType } from "../gender";

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    isGuest: boolean;
    defaultAddress?: {
      fullName: string;
      street: string;
      city: string;
      zip: string;
      country: string;
      phone: string;
    };
    isVerified: boolean;
    customerNumber: string;
    isAdmin: boolean;
    accessToken?: string;
    refreshToken?: string;
  }

 export interface IUserRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export interface ICategory extends Document {
  name: string;
  gender: GenderType;
}

export interface IColorOption {
  name: string;
  code: string;
}

export interface IProduct extends Document {
  name: String;
  description: String;
  price: Number;
  image?:String[];
  category: String | mongoose.Types.ObjectId;
  stock: Number;
  colors: IColorOption[];
  weight: Number;
  createdAt: Date;
}
 
export interface INewsletter extends Document {
  email: string;
  subscribed: boolean;
  timeStamp: Date;
}