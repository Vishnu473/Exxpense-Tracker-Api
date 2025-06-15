import mongoose from 'mongoose';
import { ITransaction } from '../interfaces/transaction.interface';
import { updateWallet } from '../utils/wallet.utils';

const transactionSchema = new mongoose.Schema<ITransaction>(
  {
    amount: { type: Number, required: true },
    source: { type: String, enum: ['Cash', 'Bank Account', 'Other'], required: true },
    source_detail: { type: String, trim: true }, 
    payment_app: { type: String,enum: ['PhonePe', 'GPay', 'AmazonPay', 'Paytm', 'RazorPay', 'Other'], },
    description: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    category_type: { type: String, enum: ['income', 'expense'], required: true },
    category_name: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Success', 'Failed'], default: 'Success' },
    transaction_date: { type: Date, required: true },
  },
  { timestamps: true }
);

// 1. CREATE
transactionSchema.post('save', async function (doc) {
  await updateWallet(doc.user.toString());
});

// 2. UPDATE
transactionSchema.post('findOneAndUpdate', async function () {
  const updated = await this.model.findOne(this.getQuery());
  if (updated) {
    await updateWallet(updated.user.toString());
  }
});

// 3. DELETE (findOneAndDelete)
transactionSchema.post('findOneAndDelete', async function (doc: any) {
  if (doc) {
    await updateWallet(doc.user.toString());
  }
});

// 4. DELETE (deleteOne) – optional if you use deleteOne directly
transactionSchema.post('deleteOne', { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    await updateWallet(doc.user.toString());
  }
});


export const TransactionModel = mongoose.model<ITransaction>('Transaction', transactionSchema);


