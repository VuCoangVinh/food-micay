import db from '../config/database.js';

const completedRevenueStatuses = ['completed', 'confirmed'];

/**
 * Tính toán doanh thu cho tất cả các ngày từ trước đến nay
 */
export const calculateAllDailyRevenue = async () => {
  try {
    // Get all orders
    const orders = await db.all('SELECT * FROM orders ORDER BY created_at ASC');
    
    if (orders.length === 0) {
      console.log('Không có đơn hàng nào');
      return;
    }

    // Get all unique dates
    const dates = new Set();
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      dates.add(date);
    });

    // Calculate revenue for each date
    let count = 0;
    for (const date of dates) {
      try {
        await calculateAndSaveDailyRevenue(date);
        count++;
      } catch (error) {
        console.error(`Error calculating revenue for ${date}:`, error);
      }
    }

    console.log(`✅ Calculated revenue for ${count} days`);
    return count;
  } catch (error) {
    console.error('Error calculating all daily revenue:', error);
    throw error;
  }
};

/**
 * Tính toán và lưu doanh thu hàng ngày
 */
export const calculateAndSaveDailyRevenue = async (date) => {
  try {
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    
    // Lấy tất cả đơn hàng trong ngày
    const orders = await db.all(
      `SELECT * FROM orders 
       WHERE DATE(created_at) = ? AND status IN (${completedRevenueStatuses.map(() => '?').join(',')})`,
      [dateStr, ...completedRevenueStatuses]
    );

    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);
    const completedOrders = orders.length;
    
    // Lấy tổng số đơn hàng trong ngày (tất cả trạng thái)
    const allOrders = await db.all(
      `SELECT * FROM orders WHERE DATE(created_at) = ?`,
      [dateStr]
    );
    const totalOrders = allOrders.length;
    
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Upsert daily revenue
    const existing = await db.get(
      'SELECT id FROM daily_revenue WHERE date = ?',
      [dateStr]
    );

    if (existing) {
      await db.run(
        `UPDATE daily_revenue 
         SET total_revenue = ?, completed_orders = ?, total_orders = ?, average_order_value = ?, updated_at = CURRENT_TIMESTAMP
         WHERE date = ?`,
        [totalRevenue, completedOrders, totalOrders, averageOrderValue, dateStr]
      );
    } else {
      await db.run(
        `INSERT INTO daily_revenue (date, total_revenue, completed_orders, total_orders, average_order_value)
         VALUES (?, ?, ?, ?, ?)`,
        [dateStr, totalRevenue, completedOrders, totalOrders, averageOrderValue]
      );
    }

    console.log(`✅ Daily revenue calculated for ${dateStr}`);
    return { date: dateStr, totalRevenue, completedOrders, totalOrders, averageOrderValue };
  } catch (error) {
    console.error('Error calculating daily revenue:', error);
    throw error;
  }
};

/**
 * Lấy báo cáo doanh thu theo ngày
 */
export const getRevenueByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const revenues = await db.all(
      `SELECT * FROM daily_revenue 
       WHERE date >= ? AND date <= ? 
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    res.json(revenues);
  } catch (error) {
    console.error('Get revenue by date range error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy báo cáo doanh thu' });
  }
};

/**
 * Lấy doanh thu theo tuần
 */
export const getRevenueByWeek = async (req, res) => {
  try {
    const { year, week } = req.query;

    if (!year || !week) {
      return res.status(400).json({ error: 'year and week are required' });
    }

    // Calculate Monday and Sunday of the week
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const monday = new Date(simple);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];

    const revenues = await db.all(
      `SELECT * FROM daily_revenue 
       WHERE date >= ? AND date <= ? 
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
    const totalOrders = revenues.reduce((sum, r) => sum + (r.completed_orders || 0), 0);

    res.json({
      year,
      week,
      startDate,
      endDate,
      dailyRevenue: revenues,
      weeklyTotal: totalRevenue,
      weeklyOrders: totalOrders,
      averageDaily: revenues.length > 0 ? totalRevenue / revenues.length : 0
    });
  } catch (error) {
    console.error('Get revenue by week error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy báo cáo tuần' });
  }
};

/**
 * Lấy doanh thu theo tháng
 */
export const getRevenueByMonth = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'year and month are required' });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const revenues = await db.all(
      `SELECT * FROM daily_revenue 
       WHERE date >= ? AND date <= ? 
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
    const totalOrders = revenues.reduce((sum, r) => sum + (r.completed_orders || 0), 0);

    res.json({
      year,
      month,
      startDate,
      endDate,
      dailyRevenue: revenues,
      monthlyTotal: totalRevenue,
      monthlyOrders: totalOrders,
      averageDaily: revenues.length > 0 ? totalRevenue / revenues.length : 0
    });
  } catch (error) {
    console.error('Get revenue by month error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy báo cáo tháng' });
  }
};

/**
 * Lấy thống kê doanh thu tổng quát
 */
export const getRevenueStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Doanh thu hôm nay
    const todayRevenue = await db.get(
      'SELECT * FROM daily_revenue WHERE date = ?',
      [todayStr]
    );

    // Doanh thu tuần này
    const monday = new Date(today);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    const mondayStr = monday.toISOString().split('T')[0];

    const weekRevenues = await db.all(
      'SELECT SUM(total_revenue) as total, COUNT(*) as days FROM daily_revenue WHERE date >= ?',
      [mondayStr]
    );

    // Doanh thu tháng này
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayStr = firstDay.toISOString().split('T')[0];

    const monthRevenues = await db.all(
      'SELECT SUM(total_revenue) as total, COUNT(*) as days FROM daily_revenue WHERE date >= ?',
      [firstDayStr]
    );

    // Tổng doanh thu tất cả
    const totalStats = await db.get(
      'SELECT SUM(total_revenue) as total, COUNT(*) as days, SUM(completed_orders) as orders FROM daily_revenue'
    );

    res.json({
      today: todayRevenue || { date: todayStr, total_revenue: 0, completed_orders: 0, total_orders: 0 },
      thisWeek: {
        total: (weekRevenues[0]?.total || 0),
        days: (weekRevenues[0]?.days || 0)
      },
      thisMonth: {
        total: (monthRevenues[0]?.total || 0),
        days: (monthRevenues[0]?.days || 0)
      },
      allTime: {
        total: (totalStats?.total || 0),
        days: (totalStats?.days || 0),
        orders: (totalStats?.orders || 0)
      }
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thống kê doanh thu' });
  }
};
