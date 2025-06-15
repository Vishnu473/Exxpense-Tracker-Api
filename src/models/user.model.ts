import mongoose, { Document, Types, Schema } from 'mongoose';
import { IUser } from '../interfaces/user.interface';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    bankAccounts: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', userSchema);