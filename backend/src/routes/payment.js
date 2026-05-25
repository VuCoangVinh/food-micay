import express from 'express';
import {
  processEWalletPayment
} from '../controllers/paymentController.js';

const router = express.Router();

// E-wallet payment (MoMo, ZaloPay)
router.post('/ewallet', processEWalletPayment);

export default router;

