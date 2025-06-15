import { Document, Types } from 'mongoose';

export interface ISaving extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    source: 'Cash' | 'Bank Account' | 'Other';
    source_detail?: string;
    payment_app?: 'GPay' | 'PhonePe' | 'Paytm' | 'AmazonPay' | 'RazorPay' | 'Other';
    purpose: string;
    is_completed: boolean;
    current_amount: number;
    expected_at: Date;
    amount: number;
    transaction_date: Date;
    pic?: string; // optional for V2
    createdAt?: Date;
    updatedAt?: Date;
}
