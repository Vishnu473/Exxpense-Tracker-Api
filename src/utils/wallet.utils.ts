import { TransactionModel } from "../models/transaction.model";
import { SavingModel } from "../models/saving.model";
import { WalletModel } from "../models/wallet.model";

export const updateWallet = async (userId: string): Promise<void> => {
  try {
    // Step 1: Fetch all successful transactions
    const transactions = await TransactionModel.find({ user: userId, status: "Success" });

    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      if (tx.category_type === "income") income += tx.amount;
      else if (tx.category_type === "expense") expense += tx.amount;
    }

    // Step 2: Fetch all savings
    const savings = await SavingModel.find({ user: userId });

    // Total savings made from Cash or Bank Account (counted as income spent)
    const validSavingAmount = savings
      .reduce((acc, item) => acc + item.current_amount, 0);

    // Step 3: Wallet Balance = Income - Expenses - Valid Savings
    const balance = income - expense - validSavingAmount;

    // Step 4: Create or update Wallet
    const wallet = await WalletModel.findOne({ user_id: userId });

    if (wallet) {
      wallet.income = income;
      wallet.expense = expense;
      wallet.savings = validSavingAmount;
      wallet.balance = balance;
      wallet.updatedAt = new Date();
      await wallet.save();
    } else {
      await WalletModel.create({
        user_id: userId,
        income,
        expense,
        savings: validSavingAmount,
        balance,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    
  } catch (err) {
    console.error("❌ Error in updateWallet():", err);
  }
};
