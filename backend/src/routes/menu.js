import express from 'express';
import { getAllMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);

// Protected admin routes
router.post('/', authenticate, requireAdmin, createMenuItem);
router.put('/:id', authenticate, requireAdmin, updateMenuItem);
router.delete('/:id', authenticate, requireAdmin, deleteMenuItem);

export default router;















