import express from 'express';
import {
  createTransaction,
  // deleteTransaction,
  getTransactions,
  updateTransaction,
} from '../controllers/transaction.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/requestValidate';
import { transactionSchema } from '../zod/transaction.schema';

const router = express.Router();

router.get('/getAll', protect,getTransactions);
router.post('/create', protect, validate(transactionSchema), createTransaction);
router.put('/:id', protect, validate(transactionSchema), updateTransaction);
// router.delete('/:id', protect, deleteTransaction);

export default router;
