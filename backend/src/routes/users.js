import express from 'express';
import { getAllUsers, getUserById, deleteUser } from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin
router.get('/', authenticate, requireAdmin, getAllUsers);
router.get('/:id', authenticate, requireAdmin, getUserById);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;















