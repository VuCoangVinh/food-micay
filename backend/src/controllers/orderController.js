import db from '../config/database.js';
import { sendOrderConfirmation } from '../config/email.js';
import { calculateAndSaveDailyRevenue } from './revenueController.js';

export const getAllOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = 'SELECT * FROM orders';
    let params = [];
    const conditions = [];

    // Build WHERE conditions
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      // Search theo ID, số điện thoại, số bàn, và tổng tiền
      conditions.push('(id LIKE ? OR customer_phone LIKE ? OR table_number LIKE ? OR CAST(total_price AS TEXT) LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add ORDER BY
    query += ' ORDER BY created_at DESC';

    const orders = await db.all(query, params);
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông tin đơn hàng' });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is requesting their own orders or is admin
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(orders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy đơn hàng' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      tableId,
      customerName,
      customerEmail,
      customerPhone,
      tableNumber,
      numberOfGuests,
      items,
      totalPrice,
      paymentMethod
    } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng không được để trống' });
    }

    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ error: 'Tổng giá không hợp lệ' });
    }

    // customerName is optional, use default if not provided
    const finalCustomerName = customerName && customerName.trim() ? customerName.trim() : 'Khách hàng';

    // Validate and prepare items JSON
    let itemsJson;
    try {
      itemsJson = typeof items === 'string' ? items : JSON.stringify(items);
    } catch (jsonError) {
      console.error('Error stringifying items:', jsonError);
      return res.status(400).json({ error: 'Dữ liệu giỏ hàng không hợp lệ' });
    }

    const result = await db.run(
      `INSERT INTO orders (
        user_id, table_id, customer_name, customer_email, customer_phone,
        table_number, number_of_guests, items, total_price, payment_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        tableId || null,
        finalCustomerName,
        customerEmail || null,
        customerPhone || null,
        tableNumber || null,
        numberOfGuests || null,
        itemsJson,
        totalPrice,
        paymentMethod || 'cash', // Default payment method
        'pending' // Default status - pending (chưa thanh toán)
      ]
    );

    // Check if insert was successful
    if (!result || !result.lastID) {
      console.error('Insert failed, result:', result);
      return res.status(500).json({ error: 'Không thể tạo đơn hàng trong database' });
    }

    const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', [result.lastID]);
    
    if (!newOrder) {
      console.error('Order not found after insert, lastID:', result.lastID);
      return res.status(500).json({ error: 'Đơn hàng đã được tạo nhưng không thể truy xuất' });
    }
    
    // Gửi email xác nhận đơn hàng (async, không chờ)
    if (customerEmail) {
      sendOrderConfirmation({
        customerEmail,
        customerName,
        orderId: newOrder.id,
        items,
        totalPrice,
        tableNumber,
        paymentMethod: paymentMethod || 'cash',
        createdAt: newOrder.created_at
      }).catch(err => console.error('Error sending order confirmation email:', err));
    }
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    // Log detailed error for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ 
      error: 'Đã xảy ra lỗi khi tạo đơn hàng',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    // Update daily revenue if order is completed
    if (status === 'completed') {
      try {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        await calculateAndSaveDailyRevenue(orderDate);
      } catch (revenueError) {
        console.error('Error updating daily revenue:', revenueError);
        // Don't fail the request if revenue calculation fails
      }
    }

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng' });
  }
};


