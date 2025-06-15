import { Document, Types } from 'mongoose';

export interface ICategory extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    name: string;
    type: 'income' | 'expense';
    isUserDefined: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
