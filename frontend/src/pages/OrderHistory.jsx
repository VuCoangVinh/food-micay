import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, Package } from 'lucide-react';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = () => {
    const stored = localStorage.getItem('orders');
    if (stored) {
      const allOrders = JSON.parse(stored);
      // Filter orders for current user or guest orders (by email if not logged in)
      let userOrders;
      if (user) {
        userOrders = allOrders.filter(order => order.userId === user.id);
      } else {
        // For guests, show orders matching their email from localStorage (if any)
        const guestEmail = localStorage.getItem('guest_email');
        if (guestEmail) {
          userOrders = allOrders.filter(order => 
            order.userId === null && order.userEmail === guestEmail
          );
        } else {
          userOrders = [];
        }
      }
      setOrders(userOrders);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return formatDateTimeVN(dateString);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="#48bb78" />;
      default:
        return <Clock size={20} color="#ed8936" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ xử lý';
      case 'processing':
        return 'Đang xử lý';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  return (
    <div className="section">
      <div className="container">
        <h2 style={{ color: '#2d3748', marginBottom: '2rem' }}>Lịch Sử Đơn Hàng</h2>

        {orders.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <Package size={64} color="#cbd5e0" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.2rem', color: '#718096', marginBottom: '1rem' }}>
              Bạn chưa có đơn hàng nào
            </p>
            <a href="/menu" className="btn">
              Xem Thực Đơn
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>
                      Đơn hàng #{order.id}
                    </h3>
                    {order.tableNumber && (
                      <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                        Bàn: {order.tableNumber} {order.numberOfGuests && `(${order.numberOfGuests} người)`}
                      </p>
                    )}
                    <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                      Ngày đặt: {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getStatusIcon(order.status)}
                    <span style={{ fontWeight: '600', color: '#4a5568' }}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '0.75rem', color: '#2d3748' }}>Chi tiết đơn hàng:</h4>
                  {order.items.map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '0.5rem',
                      paddingBottom: '0.5rem',
                      borderBottom: index < order.items.length - 1 ? '1px solid #e2e8f0' : 'none'
                    }}>
                      <span style={{ color: '#4a5568' }}>{item.name} x {item.quantity}</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div style={{ 
                    marginTop: '0.75rem', 
                    paddingTop: '0.75rem', 
                    borderTop: '2px solid #667eea', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}>
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#667eea' }}>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;

