import { Request, Response } from 'express';
import { SavingModel } from '../models/saving.model';
import { savingSchema } from '../zod/saving.schema';
import { ISaving } from '../interfaces/saving.interface';

export const createSaving = async (req: Request, res: Response) => {
  try {
    const parsed = savingSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const data = parsed.data;

    if (data.current_amount > data.amount) {
      res.status(400).json({
        message: 'Current amount cannot exceed target amount.',
        help: 'Add a larger target or reduce initial saving.'
      });
      return;
    }

    const newSaving = {
      ...data,
      user: req?.user?._id,
      is_completed: data.current_amount === data.amount
    };

    const created = await SavingModel.create(newSaving);
    res.status(201).json(created);
    return ;

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

    if (!existing) {
      res.status(404).json({ message: 'Saving goal not found.' });
      return;
    }

    const forbiddenFields: (keyof ISaving)[] = [
      'amount',
      'transaction_date',
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

      if (field === 'transaction_date' || field === 'expected_at') {
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

    const updatableFields: (keyof ISaving)[] = ['purpose', 'pic', 'current_amount'];
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
    }

    const updated = await SavingModel.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updateData,
      { new: true }
    );

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
