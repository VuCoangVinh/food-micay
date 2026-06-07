import db from '../config/database.js';

export const calculateAndSaveDailyRevenue = async (date) => {
  const orders = await db.all(
    'SELECT * FROM orders WHERE DATE(created_at) = ?',
    [date]
  );

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  await db.run(
    `INSERT INTO daily_revenue (date, total_revenue, completed_orders, total_orders, average_order_value, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(date) DO UPDATE SET
       total_revenue = excluded.total_revenue,
       completed_orders = excluded.completed_orders,
       total_orders = excluded.total_orders,
       average_order_value = excluded.average_order_value,
       updated_at = CURRENT_TIMESTAMP`,
    [date, totalRevenue, completedOrders.length, totalOrders, averageOrderValue]
  );
};

export const getDailyRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM daily_revenue';
    const params = [];

    if (startDate && endDate) {
      query += ' WHERE date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' WHERE date >= ?';
      params.push(startDate);
    }

    query += ' ORDER BY date DESC';

    const rows = await db.all(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get daily revenue error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy doanh thu' });
  }
};
