import { Request, Response } from 'express';
import { TransactionModel } from '../models/transaction.model';
import { SavingModel } from '../models/saving.model';
import dayjs from 'dayjs';

//GET /api/v1/analytics/monthly-trend
export const getMonthlyTrend = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const results = await TransactionModel.aggregate([
      { $match: { user: userId, status: 'Success' } },
      {
        $group: {
          _id: {
            year: { $year: "$transaction_date" },
            month: { $month: "$transaction_date" },
            type: "$category_type"
          },
          totalAmount: { $sum: "$amount" }
        }
      },
      {
        $group: {
          _id: { year: "$_id.year", month: "$_id.month" },
          income: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "income"] }, "$totalAmount", 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "expense"] }, "$totalAmount", 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.month" },
              "-",
              { $toString: "$_id.year" }
            ]
          },
          income: 1,
          expense: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.status(200).json(results);
    return;
  } catch (err) {
    res.status(500).json({ message: "Failed to get monthly trend", err });
    return;
  }
};

//GET /api/v1/analytics/expenses-by-category
export const getExpensesByCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const results = await TransactionModel.aggregate([
      {
        $match: {
          user: userId,
          category_type: 'expense',
          status: 'Success'
        }
      },
      {
        $group: {
          _id: "$category_name",
          total: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          total: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json(results);
    return;
  } catch (err) {
    res.status(500).json({ message: "Failed to get expenses by category", err });
    return;
  }
};


//GET /api/v1/analytics/spending-by-source
export const getSpendingBySource = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const results = await TransactionModel.aggregate([
      {
        $match: {
          user: userId,
          category_type: 'expense',
          status: 'Success'
        }
      },
      {
        $group: {
          _id: "$source_detail",
          total: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          total: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json(results);
    return;
  } catch (err) {
    res.status(500).json({ message: "Failed to get spending by source", err });
    return;
  }
};

//GET /api/v1/analytics/payment-app-usage
export const getPaymentAppUsage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const usage = await TransactionModel.aggregate([
      {
        $match: {
          user: userId,
          status: 'Success',
          payment_app: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$payment_app",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          app: "$_id",
          total: "$total",
          count: "$count"
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json(usage);
    return;
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment app usage", error });
    return;
  }
};

//GET /api/v1/analytics/saving-progress
export const getSavingProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const savings = await SavingModel.find({ user: userId });

    const progress = savings.map(s => ({
      id: s._id,
      purpose: s.purpose,
      current_amount: s.current_amount,
      target_amount: s.amount,
      percent: Math.min((s.current_amount / s.amount) * 100, 100).toFixed(2),
      is_completed: s.is_completed
    }));

    res.status(200).json(progress);
    return;
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch saving progress", error });
    return;
  }
};

//GET /api/v1/analytics/financial-overview
export const getFinancialOverview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // Monthly income & expense
    const txStats = await TransactionModel.aggregate([
      {
        $match: {
          user: userId,
          status: 'Success'
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$transaction_date" },
            year: { $year: "$transaction_date" },
            type: "$category_type"
          },
          total: { $sum: "$amount" }
        }
      }
    ]);

    // Monthly savings
    const savingStats = await SavingModel.aggregate([
      {
        $match: {
          user: userId
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$transaction_date" },
            year: { $year: "$transaction_date" }
          },
          total_saved: { $sum: "$current_amount" }
        }
      }
    ]);

    const combinedMap = new Map<string, any>();

    // Add income/expense
    for (const item of txStats) {
      const key = `${item._id.month}-${item._id.year}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, {
          month: key,
          income: 0,
          expense: 0,
          savings: 0
        });
      }
      const record = combinedMap.get(key);
      if (item._id.type === 'income') record.income += item.total;
      if (item._id.type === 'expense') record.expense += item.total;
      combinedMap.set(key, record);
    }

    // Add savings
    for (const s of savingStats) {
      const key = `${s._id.month}-${s._id.year}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, {
          month: key,
          income: 0,
          expense: 0,
          savings: 0
        });
      }
      const record = combinedMap.get(key);
      record.savings += s.total_saved;
      combinedMap.set(key, record);
    }

    const result = Array.from(combinedMap.values()).sort((a, b) => {
      const [m1, y1] = a.month.split('-').map(Number);
      const [m2, y2] = b.month.split('-').map(Number);
      return new Date(y1, m1 - 1).getTime() - new Date(y2, m2 - 1).getTime();
    });

    res.status(200).json(result);
    return;
  } catch (error) {
    res.status(500).json({ message: "Failed to get financial overview", error });
    return;
  }
};

//GET /api/v1/analytics/balance-growth
export const getBalanceGrowth = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const tx = await TransactionModel.aggregate([
      { $match: { user: userId, status: "Success" } },
      {
        $group: {
          _id: {
            year: { $year: "$transaction_date" },
            month: { $month: "$transaction_date" },
            type: "$category_type"
          },
          total: { $sum: "$amount" }
        }
      }
    ]);

    const savings = await SavingModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: {
            year: { $year: "$transaction_date" },
            month: { $month: "$transaction_date" }
          },
          saved: { $sum: "$current_amount" }
        }
      }
    ]);

    const map = new Map<string, { month: string; income: number; expense: number; savings: number }>();

    for (const t of tx) {
      const key = `${t._id.month}-${t._id.year}`;
      if (!map.has(key)) {
        map.set(key, { month: key, income: 0, expense: 0, savings: 0 });
      }
      const rec = map.get(key)!;
      if (t._id.type === 'income') rec.income += t.total;
      else if (t._id.type === 'expense') rec.expense += t.total;
    }

    for (const s of savings) {
      const key = `${s._id.month}-${s._id.year}`;
      if (!map.has(key)) {
        map.set(key, { month: key, income: 0, expense: 0, savings: 0 });
      }
      map.get(key)!.savings = s.saved;
    }

    const sorted = Array.from(map.values()).sort((a, b) => {
      const [m1, y1] = a.month.split('-').map(Number);
      const [m2, y2] = b.month.split('-').map(Number);
      return new Date(y1, m1 - 1).getTime() - new Date(y2, m2 - 1).getTime();
    });

    let cumulativeBalance = 0;
    const result = sorted.map((r) => {
      const net = r.income - r.expense - r.savings;
      cumulativeBalance += net;
      return {
        month: r.month,
        balance: cumulativeBalance.toFixed(2),
      };
    });

    res.status(200).json(result);
    return;
  } catch (error) {
    res.status(500).json({ message: "Balance growth fetch failed", error });
    return;
  }
};

//GET /api/v1/analytics/transaction-heatmap
export const getTransactionHeatmap = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const result = await TransactionModel.aggregate([
      {
        $match: {
          user: userId,
          status: "Success"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$transaction_date" },
            month: { $month: "$transaction_date" },
            day: { $dayOfMonth: "$transaction_date" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day"
            }
          },
          count: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.status(200).json(result);
    return;
  } catch (error) {
    res.status(500).json({ message: "Transaction heatmap failed", error });
    return;
  }
};

//GET /api/v1/analytics/savings-status
export const getSavingsStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const result = await SavingModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$is_completed",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: {
            $cond: [{ $eq: ["$_id", true] }, "Completed", "In Progress"]
          },
          count: 1
        }
      }
    ]);

    res.status(200).json(result);
    return;
  } catch (error) {
    res.status(500).json({ message: "Savings status fetch failed", error });
    return;
  }
};

//GET /api/v1/analytics/expense-status-breakdown
export const getExpenseStatusBreakdown = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const result = await TransactionModel.aggregate([
      {
        $match: {
          user: userId,
          category_type: "expense"
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1
        }
      }
    ]);

    res.status(200).json(result);
    return;
  } catch (error) {
    res.status(500).json({ message: "Expense status breakdown failed", error });
    return;
  }
};