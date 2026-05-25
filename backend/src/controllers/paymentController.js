import db from '../config/database.js';
import { sendOrderConfirmation, sendPaymentConfirmation } from '../config/email.js';

/**
 * Xử lý thanh toán MoMo/ZaloPay (mock - cần tích hợp API thực tế)
 */
export const processEWalletPayment = async (req, res) => {
  try {
    const { orderId, phoneNumber, walletType } = req.body;

    if (!orderId || !phoneNumber) {
      return res.status(400).json({ error: 'Order ID and phone number are required' });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // TODO: Tích hợp MoMo/ZaloPay API thực tế
    // Hiện tại chỉ mock
    const paymentSuccess = true;

    if (paymentSuccess) {
      await db.run(
        'UPDATE orders SET status = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['completed', walletType, orderId]
      );

      await sendPaymentConfirmation({
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        orderId: order.id,
        totalPrice: order.total_price,
        paymentMethod: walletType
      });

      res.json({ 
        success: true, 
        message: 'Thanh toán thành công',
        orderId: order.id
      });
    } else {
      res.status(400).json({ error: 'Thanh toán thất bại' });
    }
  } catch (error) {
    console.error('Process e-wallet payment error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xử lý thanh toán' });
  }
};

