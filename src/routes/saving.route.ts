import express from 'express';
import {
  createSaving,
  deleteSaving,
  getSavings,
  updateSaving,
} from '../controllers/saving.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/requestValidate';
import { savingSchema } from '../zod/saving.schema';

const router = express.Router();

router.get('/getAll', protect, getSavings);
router.post('/create', protect, validate(savingSchema), createSaving);
router.put('/:id', protect, validate(savingSchema), updateSaving);
router.delete('/:id', protect, deleteSaving);

export default router;
