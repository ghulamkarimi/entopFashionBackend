import mongoose from "mongoose";
import { GenderType } from "../gender";

export interface IUser {
     _id?: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    isGuest: boolean;
    defaultAddress?: {
      fullName: string;
      street: string;
      houseNumber: string;
      city: string;
      zip: string;
      country: string;
      phone: string;
    };
    isVerified: boolean;
    customerNumber: string;
    isAdmin: boolean;
    owner: boolean;
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
  hexCode: string;
  _id: mongoose.Types.ObjectId;
}

export interface IProduct extends Document {
  name: String;
  description: String;
  price: Number;
  image?:string[];
  category: String | mongoose.Types.ObjectId;
  stock: Number;
  colors: (IColorOption | mongoose.Types.ObjectId)[];
  sizes?: String[];
  brand?: String; 
  sku?: String;
  newPrice?: Number;
  isFeatured?: Boolean;
  discount?: Number;
  deliveryTime?: String;
  tags?: String[];
  material?: String;
  gender: GenderType;
  originCountry?: String;
  weight: Number;
  createdAt: Date;
}
 
export interface INewsletter extends Document {
  email: string;
  subscribed: boolean;
  timeStamp: Date;
}

export type SafeUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  address?: any;
  defaultAddress?: IUser["defaultAddress"];
  isAdmin: boolean;
  customerNumber?: string;
  owner?: boolean;
  isAccountVerified?: boolean;
};

export type SafeUserBasic = Pick<
  IUser,
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "defaultAddress"
  | "isAdmin"
  | "customerNumber"
  | "owner"
> & { _id: string };

export type AuthUser = {
  _id?: unknown;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  customerNumber?: string;
  owner?: boolean;
  defaultAddress?: IUser["defaultAddress"];
};
