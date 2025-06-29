import { Request, Response } from 'express';
import { SavingModel } from '../models/saving.model';
import { createSavingSchema, savingSchema } from '../zod/saving.schema';
import { ISaving } from '../interfaces/saving.interface';
import { TransactionModel } from '../models/transaction.model';
import { ITransaction } from '../interfaces/transaction.interface';
import { CategoryModel } from '../models/category.model';

export const createSaving = async (req: Request, res: Response) => {
  try {
    const parsed = createSavingSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const data = parsed.data;

    const newSaving = {
      ...data,
      user: req?.user?._id,
      is_completed: false,
      current_amount: 0,
    };


    const categories = await CategoryModel.find({ isUserDefined: false });
    const savingCategory = categories.filter((cat) => cat.type === "saving");
    if (savingCategory.length > 0) {
      console.log("There is a savingcategory from categories",categories);
      
      const created = await SavingModel.create(newSaving);
      const savingTransaction = {
        amount: 0,
        source: data.source,
        source_detail: data.source_detail,
        payment_app: data.payment_app,
        description: `Initial saving: ${data.purpose}`,
        user: req?.user?._id,
        category_id: savingCategory[0]?._id,
        category_type: 'saving',
        category_name: savingCategory[0]?.name,
        status: 'Success',
        transaction_date: new Date(data.transaction_date)
      }
      await TransactionModel.create(savingTransaction);
      res.status(201).json(created);
    }


    return;

  } catch (error) {
    console.error('Error creating saving:', error);
    res.status(500).json({ message: 'Failed to create saving', error });
    return;
  }
};

export const getSavings = async (req: Request, res: Response) => {
  try {
    const savings = await SavingModel.find({ user: req?.user?._id }).sort({ transaction_date: -1 }).sort({ expected_at: 1 });
    res.status(200).json(savings);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch savings', error });
    return;
  }
};

export const updateSaving = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await SavingModel.findOne({
      _id: id,
      user: req.user._id
    });

    console.log(existing);


    if (!existing) {
      res.status(404).json({ message: 'Saving goal not found.' });
      return;
    }

    const forbiddenFields: (keyof ISaving)[] = [
      'amount',
      'expected_at',
      'source',
      'source_detail',
      'payment_app'
    ];

    for (const field of forbiddenFields) {
      if (!(field in req.body)) continue;

      const reqValue = req.body[field];
      const existingValue = existing[field];

      let areEqual = false;

      if (field === 'expected_at') {
        const reqDate = new Date(reqValue).toISOString().split('T')[0];
        const existingDate = new Date(existingValue as Date).toISOString().split('T')[0];
        areEqual = reqDate === existingDate;
      } else {
        areEqual = String(reqValue) === String(existingValue);
      }

      if (!areEqual) {
        res.status(400).json({
          message: `Modification of '${field}' is not allowed.`,
          help: `Create a new saving goal if major details need to be changed.`
        });
        return;
      }
    }

    const updatableFields: (keyof ISaving)[] = ['purpose', 'transaction_date', 'pic', 'current_amount'];
    const updateData: Partial<ISaving> = {};

    for (const field of updatableFields) {
      if (!(field in req.body)) continue;

      if (field === 'current_amount') {
        const newAmount = Number(req.body[field]);
        if (isNaN(newAmount) || newAmount < 0) {
          res.status(400).json({ message: 'Invalid current amount.' });
          return;
        }

        if (newAmount > existing.amount) {
          res.status(400).json({
            message: 'Cannot exceed the target saving amount.',
            help: `Target: ₹${existing.amount}, Attempted: ₹${newAmount}`
          });
          return;
        }

        updateData.current_amount = newAmount;
        updateData.is_completed = newAmount === existing.amount;
      } else {
        updateData[field] = req.body[field];
      }

      if (field === 'transaction_date') {
        const transaction_date = new Date(req.body[field]).toISOString().split('T')[0];
        if (new Date(transaction_date) > new Date()) {
          res.status(400).json({ message: 'Transaction date cannot be the future date.' });
          return;
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    const updated = await SavingModel.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updateData,
      { new: true }
    );

    const categories = await CategoryModel.find({ isUserDefined: false });
    const savingCategory = categories.filter((cat) => cat.type === "saving");

    const updateSavingTransaction = {
      amount: Number(req.body["current_amount"]) - existing.current_amount,
      source: existing.source,
      source_detail: existing.source_detail,
      payment_app: existing.payment_app,
      description: `Added to saving: ${updateData.purpose}`,
      user: req?.user?._id,
      category_id: savingCategory[0]?._id,
      category_type: 'saving',
      category_name: savingCategory[0]?.name,
      status: 'Success',
      transaction_date: new Date(new Date(req.body["transaction_date"]).toISOString().split('T')[0])
    }
    await TransactionModel.create(updateSavingTransaction);

    res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Error updating saving:', error);
    res.status(500).json({ message: 'Failed to update saving', error });
  }
};

export const deleteSaving = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await SavingModel.findOneAndDelete({ _id: id, user: req?.user?._id });
    if (!deleted) {
      res.status(404).json({ message: 'Saving not found' });
      return;
    }
    res.status(200).json({ message: 'Saving deleted successfully' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete saving', error });
    return;
  }
};

interface FileCategoryRequest extends Request {
  file?: Express.Multer.File;
  fileCategory?: 'image';
}

export const uploadSingleFile = (req: FileCategoryRequest, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      success: true,
      url: req?.file?.path,
      file: req.file,
      message: `${req.fileCategory} uploaded successfully`,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error. Failed to upload Image to Api',
    });
  }
};
