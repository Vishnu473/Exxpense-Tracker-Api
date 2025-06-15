import { Document, Types } from 'mongoose';

export interface ITransaction extends Document {
    _id: Types.ObjectId;
    amount: number;
    source: 'Cash' | 'Bank Account' | 'Other';
    source_detail?: string;
    payment_app?: 'GPay' | 'PhonePe' | 'AmazonPay' | 'Paytm' | 'RazorPay' | 'Other';
    description: string;
    user: Types.ObjectId;
    category_id: Types.ObjectId;
    category_type: 'income' | 'expense';
    category_name: string;
    status: 'Pending' | 'Success' | 'Failed';
    transaction_date: Date;
    updatedAt?: Date;
    createdAt?: Date;
}
