import express from 'express';
import { getAllTables, getTableById, createTable, updateTable, deleteTable } from '../controllers/tableController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllTables);
router.get('/:id', getTableById);

// Protected admin routes
router.post('/', authenticate, requireAdmin, createTable);
router.put('/:id', authenticate, requireAdmin, updateTable);
router.delete('/:id', authenticate, requireAdmin, deleteTable);

export default router;















