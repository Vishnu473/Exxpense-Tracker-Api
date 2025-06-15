import mongoose from 'mongoose';
import { ISaving } from '../interfaces/saving.interface';
import { updateWallet } from '../utils/wallet.utils';

const savingSchema = new mongoose.Schema<ISaving>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['Cash', 'Bank Account', 'Other'], required: true },
    source_detail: { type: String, trim: true }, 
    payment_app: {
      type: String,
      enum: ['GPay', 'PhonePe', 'Paytm', 'AmazonPay', 'RazorPay', 'Other'],
    },
    purpose: { type: String, required: true },
    is_completed: { type: Boolean, default: false },
    current_amount: { type: Number, required: true },
    expected_at: { type: Date, required: true },
    amount: { type: Number, required: true },
    transaction_date: { type: Date, required: true },
    pic: { type: String }, // optional, for V2
  },
  { timestamps: true }
);

// 1. On save (create)
savingSchema.post('save', async function (doc) {
  await updateWallet(doc.user.toString());
});

// 2. On update
savingSchema.post('findOneAndUpdate', async function () {
  const updated = await this.model.findOne(this.getQuery());
  if (updated) {
    await updateWallet(updated.user.toString());
  }
});

// 3. On findOneAndDelete
savingSchema.post('findOneAndDelete', async function (doc: any) {
  if (doc) {
    await updateWallet(doc.user.toString());
  }
});

// 4. On deleteOne (optional, only if you use deleteOne())
savingSchema.post('deleteOne', { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    await updateWallet(doc.user.toString());
  }
});


export const SavingModel = mongoose.model<ISaving>('Saving', savingSchema);
