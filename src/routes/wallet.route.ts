import express from 'express';
import { createWallet, getSourceAnalytics, getWalletByUserId } from '../controllers/wallet.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/me', protect, getWalletByUserId);
router.post('/create',protect,createWallet);
router.get('/source-analytics', protect, getSourceAnalytics);

export default router;
