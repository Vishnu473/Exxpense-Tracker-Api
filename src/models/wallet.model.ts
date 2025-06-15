import mongoose from 'mongoose';
import { IWallet } from '../interfaces/wallet.interface';

const walletSchema = new mongoose.Schema<IWallet>(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0 },
    income: { type: Number, default: 0 },
    expense: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const WalletModel = mongoose.model<IWallet>('Wallet', walletSchema);
