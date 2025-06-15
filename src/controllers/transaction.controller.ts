import { Request, Response } from 'express';
import { TransactionModel } from '../models/transaction.model';
import { UserModel } from '../models/user.model';
import { ITransaction } from '../interfaces/transaction.interface';
import { getTransactionsQuerySchema } from '../zod/transaction.schema';

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req?.user?._id;
    const { source, source_detail } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if ("Bank Account" === source) {
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const allowedList =  user.bankAccounts;
      if (!source_detail || !allowedList.includes(source_detail)) {
        res.status(400).json({
          message: `Invalid bank account selected`,
        });
        return;
      }
    }

    const transaction = await TransactionModel.create({
      ...req.body,
      user: userId,
    });

    res.status(201).json(transaction);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to create transaction', error });
    return;
  }
};

// export const getTransactions = async (req: Request, res: Response) => {
//   try {
//     const transactions = await TransactionModel.find({ user: req?.user?._id }).sort({ transaction_date: -1 });
//     res.status(200).json(transactions);
//     return;
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch transactions', error });
//     return;
//   }
// };

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await TransactionModel.findOne({
      _id: id,
      user: req?.user?._id
    });

    if (!existing) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    const forbiddenFields: (keyof ITransaction)[] = [
      'amount',
      'category_id',
      'source',
      'source_detail',
      'transaction_date'
    ];

    for (const field of forbiddenFields) {
      if (!(field in req.body)) continue;

      const reqValue = req.body[field];
      const existingValue = existing[field];

      let areEqual = false;

      if (field === 'transaction_date') {
        const reqDate = new Date(reqValue).toISOString().split('T')[0];
        const existingDate = new Date(existingValue as Date).toISOString().split('T')[0];
        areEqual = reqDate === existingDate;
      } else {
        areEqual = String(reqValue) === String(existingValue);
      }

      if (!areEqual) {
        res.status(400).json({
          message: `Modification of '${field}' is not allowed.`,
          help: `For example, if a ₹${existing.amount} ${existing.category_type} was wrongly added, you'd create a reversal.`
        });
        return;
      }
    }

    const updatableFields: (keyof ITransaction)[] = [
      'description',
      'payment_app',
      'status'
    ];

    const updateData: Partial<ITransaction> = {};
    for (const field of updatableFields) {
      if (field in req.body) {
        updateData[field] = req.body[field];
      }
    }

    const updated = await TransactionModel.findOneAndUpdate(
      { _id: id, user: req?.user?._id },
      updateData,
      { new: true }
    );

    res.status(200).json(updated);
    return;
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      message: 'Failed to update transaction',
      error
    });
    return;
  }
};


// export const deleteTransaction = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const deleted = await TransactionModel.findOneAndDelete({ _id: id, user: req?.user?._id });
//     if (!deleted) {
//       res.status(404).json({ message: 'Transaction not found' });
//       return;
//     }
//     res.status(200).json({ message: 'Transaction deleted successfully' });
//     return;
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to delete transaction', error });
//     return;
//   }
// };


export const getTransactions = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    console.log("Query : ",req.query);
    const queryValidation = getTransactionsQuerySchema.safeParse(req.query);
    
    if (!queryValidation.success) {
      res.status(400).json({
        message: 'Invalid query parameters',
        errors: queryValidation.error.errors
      });
      return;
    }

    const {
      page,
      limit,
      search,
      fromDate,
      toDate,
      category_type,
      sortBy,
      sortOrder
    } = queryValidation.data;

    // Build filter object
    const filter: any = { user: req?.user?._id };

    // Date range filtering
    if (fromDate || toDate) {
      filter.transaction_date = {};
      if (fromDate) {
        filter.transaction_date.$gte = new Date(fromDate);
      }
      if (toDate) {
        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999);
        filter.transaction_date.$lte = toDateEnd;
      }
    }

    // Category type filtering
    if (category_type) {
      filter.category_type = category_type;
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { description: searchRegex },
        { category_name: searchRegex }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [transactions, totalCount] = await Promise.all([
      TransactionModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      TransactionModel.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    // Response with pagination metadata
    const response = {
      data: transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch transactions', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};