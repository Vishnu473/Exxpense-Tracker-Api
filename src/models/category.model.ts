import mongoose from 'mongoose';
import { ICategory } from '../interfaces/category.interface';

const categorySchema = new mongoose.Schema<ICategory>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    name: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    isUserDefined: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.model<ICategory>('Category', categorySchema);
