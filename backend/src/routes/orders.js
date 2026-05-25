import express from 'express';
import { getAllOrders, getOrderById, createOrder, updateOrderStatus, getUserOrders } from '../controllers/orderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route for creating orders
router.post('/', createOrder);

// Protected routes
router.get('/user/:userId', authenticate, getUserOrders);

// Public route to get an order by ID (allow guest users to view their order after payment)
router.get('/:id', getOrderById);

// Admin routes
router.get('/', authenticate, requireAdmin, getAllOrders);
router.put('/:id/status', authenticate, requireAdmin, updateOrderStatus);

export default router;















