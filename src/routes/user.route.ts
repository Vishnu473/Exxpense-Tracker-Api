import express from 'express';
import { registerUser, loginUser, logoutUser, getMe, addBankAccount, removeBankAccount, renameBankAccount, getPaymentSources } from '../controllers/user.controller';
import { validate } from '../middleware/requestValidate';
import { registerSchema, loginSchema, accountNameSchema } from '../zod/user.schema';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/bank-account', protect, validate(accountNameSchema), addBankAccount);
router.delete('/bank-account', protect, validate(accountNameSchema), removeBankAccount);
router.patch('/bank-account/rename', protect, renameBankAccount);
// router.patch('/credit-card/rename', protect, renameCreditCard);
router.get('/payment-sources', protect, getPaymentSources);
// router.post('/credit-card', protect, validate(accountNameSchema), addCreditCard);
// router.delete('/credit-card', protect, validate(accountNameSchema), removeCreditCard);
router.get('/logout', logoutUser);
router.get('/me', protect, getMe);

export default router;
