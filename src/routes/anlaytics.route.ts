import express from 'express';
import { getBalanceGrowth, getExpensesByCategory, getExpenseStatusBreakdown, getFinancialOverview, getMonthlyTrend, getPaymentAppUsage, getSavingProgress, getSavingsStatus, getSpendingBySource, getTransactionHeatmap } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/monthly-trend', protect, getMonthlyTrend);
router.get('/expenses-by-category', protect, getExpensesByCategory);
router.get('/spending-by-source', protect, getSpendingBySource);
router.get('/payment-app-usage', protect, getPaymentAppUsage);
router.get('/saving-progress', protect, getSavingProgress);
router.get('/financial-overview', protect, getFinancialOverview);
router.get("/balance-growth", protect, getBalanceGrowth);
router.get("/transaction-heatmap", protect, getTransactionHeatmap);
router.get("/savings-status", protect, getSavingsStatus);
router.get("/expense-status-breakdown", protect, getExpenseStatusBreakdown);

export default router;