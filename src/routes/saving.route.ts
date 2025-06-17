import express from 'express';
import {
  createSaving,
  deleteSaving,
  getSavings,
  updateSaving,
  uploadSingleFile,
} from '../controllers/saving.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/requestValidate';
import { createSavingSchema, savingSchema } from '../zod/saving.schema';
import { uploadFiles } from '../middleware/multer.middleware';

const router = express.Router();

router.get('/getAll', protect, getSavings);
router.post('/create', protect, validate(createSavingSchema), createSaving);
router.put('/:id', protect, validate(savingSchema), updateSaving);
router.delete('/:id', protect, deleteSaving);
router.post("/single/:type", protect, uploadFiles("single"), uploadSingleFile);

export default router;
