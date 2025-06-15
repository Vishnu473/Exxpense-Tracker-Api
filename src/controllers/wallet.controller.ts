import { Request, Response } from 'express';
import { WalletModel } from '../models/wallet.model';
import { SavingModel } from '../models/saving.model';
import { TransactionModel } from '../models/transaction.model';

export const createWallet = async(req:Request, res:Response) => {
  try {
    const wallet = await WalletModel.create({
      user_id: req?.user?._id,
      balance: 0,
      income: 0,
      expense: 0,
      savings: 0,
    });

    res.json({wallet:wallet,message:"wallet created successfully"});
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ message: 'Server error while creating wallet' });
    return;
  }
}

export const getWalletByUserId = async (req: Request, res: Response) => {
  try {
    const userId = req?.user?._id;

    const wallet = await WalletModel.findOne({ user_id: userId });

    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    res.json(wallet);
    return;
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Server error while fetching wallet' });
    return;
  }
};

export const getSourceAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // Aggregate income & expense from Transactions
    const transactionStats = await TransactionModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$source_detail',
          income: {
            $sum: {
              $cond: [{ $eq: ['$category_type', 'income'] }, '$amount', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$category_type', 'expense'] }, '$amount', 0]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Aggregate savings per source
    const savingsStats = await SavingModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$source_detail',
          savings: { $sum: '$current_amount' },
          savingsCount: { $sum: 1 }
        }
      }
    ]);

    const analytics: Record<string, any> = {};

    transactionStats.forEach(t => {
      analytics[t._id] = {
        source_detail: t._id,
        income: t.income,
        expense: t.expense,
        transactionCount: t.count,
        savings: 0,
        savingsCount: 0
      };
    });

    savingsStats.forEach(s => {
      if (!analytics[s._id]) {
        analytics[s._id] = {
          source_detail: s._id,
          income: 0,
          expense: 0,
          transactionCount: 0,
        };
      }
      analytics[s._id].savings = s.savings;
      analytics[s._id].savingsCount = s.savingsCount;
    });

    res.status(200).json(Object.values(analytics));
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate source analytics', error });
    return;
  }
};
