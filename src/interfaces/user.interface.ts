import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  bankAccounts: string[];
  createdAt: Date;
  updatedAt: Date;
}