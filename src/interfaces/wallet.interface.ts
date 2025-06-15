import { Document, Types } from 'mongoose';

export interface IWallet extends Document {
    _id: Types.ObjectId;
    user_id: Types.ObjectId;
    balance: number;
    income: number;
    expense: number;
    savings: number;
    createdAt?: Date;
    updatedAt?: Date;
}
