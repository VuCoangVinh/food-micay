import express from 'express';
import {
  getRevenueByDateRange,
  getRevenueByWeek,
  getRevenueByMonth,
  getRevenueStats,
  calculateAllDailyRevenue
} from '../controllers/revenueController.js';

const router = express.Router();

// Lấy doanh thu theo khoảng thời gian
router.get('/date-range', getRevenueByDateRange);

// Lấy doanh thu theo tuần
router.get('/week', getRevenueByWeek);

// Lấy doanh thu theo tháng
router.get('/month', getRevenueByMonth);

// Lấy thống kê doanh thu
router.get('/stats', getRevenueStats);

// Tính toán doanh thu cho tất cả các ngày (admin only)
router.post('/calculate-all', async (req, res) => {
  try {
    const count = await calculateAllDailyRevenue();
    res.json({ success: true, message: `Calculated revenue for ${count} days`, count });
  } catch (error) {
    console.error('Calculate all daily revenue error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi tính toán doanh thu' });
  }
});

export default router;
