import express from 'express';
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/requestValidate';
import { categorySchema } from '../zod/category.schema';

const router = express.Router();

router.get('/getAll', protect, getCategories);
router.post('/create', protect, validate(categorySchema), createCategory);
router.put('/:id', protect, validate(categorySchema), updateCategory);
router.delete('/:id', protect, deleteCategory);

export default router;
