import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTable } from '../contexts/TableContext';
import { CheckCircle, Clock, Package, RefreshCw } from 'lucide-react';
import { ordersAPI } from '../services/api.js';
import { formatDateTimeVN } from '../utils/date.js';

const OrderHistory = () => {
  const { user } = useAuth();
  const { currentTable } = useTable();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadOrders();
    intervalRef.current = setInterval(() => {
      loadOrders(true);
    }, 10000);
    return () => clearInterval(intervalRef.current);
  }, [user]);

  const loadOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    if (!user || user.isGuest) {
      // Chế độ khách (guest user hoặc chưa đăng nhập): đọc từ localStorage và fetch live status
      try {
        // Xóa guestOrders nếu quá 2 giờ không truy cập
        const lastAccess = localStorage.getItem('guestOrdersLastAccess');
        if (lastAccess && Date.now() - parseInt(lastAccess) > 2 * 60 * 60 * 1000) {
          localStorage.removeItem('guestOrders');
          localStorage.removeItem('guestOrdersLastAccess');
        } else {
          localStorage.setItem('guestOrdersLastAccess', Date.now().toString());
        }

        const stored = localStorage.getItem('guestOrders');
        if (stored) {
          let guestOrders = JSON.parse(stored);
          // Lọc theo bàn hiện tại để tránh lẫn đơn hàng giữa các bàn
          if (currentTable?.number) {
            guestOrders = guestOrders.filter(order => order.tableNumber === currentTable.number);
          }
          // Fetch live status cho từng đơn hàng
          const updated = await Promise.all(
            guestOrders.map(async (order) => {
              try {
                const live = await ordersAPI.getById(order.id);
                let items = [];
                try {
                  items = typeof live.items === 'string' ? JSON.parse(live.items) : live.items || [];
                } catch {}
                return {
                  ...order,
                  status: live.status || order.status,
                  items: items.length > 0 ? items : order.items,
                };
              } catch {
                return order;
              }
            })
          );
          setOrders(updated);
        } else {
          setOrders([]);
        }
      } catch {
        setError('Không thể tải lịch sử đơn hàng.');
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Người dùng đã đăng nhập: fetch từ API
    try {
      const data = await ordersAPI.getUserOrders(user.id);
      const transformed = data.map(order => {
        let items = [];
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
        } catch {}
        return {
          id: order.id,
          tableNumber: order.table_number,
          numberOfGuests: order.number_of_guests,
          items,
          total: order.total_price,
          status: order.status,
          paymentMethod: order.payment_method,
          createdAt: order.created_at
        };
      });
      setOrders(transformed);
    } catch {
      setError('Không thể tải lịch sử đơn hàng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={20} color="#48bb78" />;
      default: return <Clock size={20} color="#ed8936" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Đang chờ xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  // Khách không có bàn và không có đơn hàng lưu → hiển thị yêu cầu đăng nhập
  if (!user && !currentTable) {
    const hasGuestOrders = (() => {
      try {
        const stored = localStorage.getItem('guestOrders');
        return stored && JSON.parse(stored).length > 0;
      } catch {
        return false;
      }
    })();

    if (!hasGuestOrders) {
      return (
        <div className="section">
          <div className="container">
            <div style={{
              textAlign: 'center', padding: '4rem 2rem',
              background: 'rgba(255,255,255,0.95)', borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <Package size={64} color="#cbd5e0" style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.2rem', color: '#718096', marginBottom: '1.5rem' }}>
                Vui lòng đăng nhập để xem lịch sử đơn hàng
              </p>
              <Link to="/login" className="btn">Đăng nhập</Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#2d3748', margin: 0 }}>Lịch Sử Đơn Hàng</h2>
          {!loading && orders.length > 0 && (
            <button
              onClick={() => loadOrders(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem',
                background: 'rgba(102,126,234,0.1)',
                border: '2px solid #667eea',
                borderRadius: '20px',
                color: '#667eea',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                opacity: refreshing ? 0.6 : 1
              }}
            >
              <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Cập nhật
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>Đang tải...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#e53e3e' }}>{error}</div>
        ) : orders.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: 'rgba(255,255,255,0.95)', borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <Package size={64} color="#cbd5e0" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.2rem', color: '#718096', marginBottom: '1.5rem' }}>
              Bạn chưa có đơn hàng nào
            </p>
            <Link to="/menu" className="btn">Xem Thực Đơn</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'rgba(255,255,255,0.95)', borderRadius: '20px',
                  padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>Đơn hàng #{order.id}</h3>
                    {(order.tableNumber || order.table_number) && (
                      <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                        Bàn: {order.tableNumber || order.table_number}
                        {(order.numberOfGuests || order.number_of_guests) && ` (${order.numberOfGuests || order.number_of_guests} người)`}
                      </p>
                    )}
                    <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                      Ngày đặt: {formatDateTimeVN(order.createdAt || order.date)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getStatusIcon(order.status)}
                    <span style={{ fontWeight: '600', color: '#4a5568' }}>{getStatusText(order.status)}</span>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '0.75rem', color: '#2d3748' }}>Chi tiết đơn hàng:</h4>
                  {(order.items || []).map((item, index) => (
                    <div key={index} style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: '0.5rem', paddingBottom: '0.5rem',
                      borderBottom: index < order.items.length - 1 ? '1px solid #e2e8f0' : 'none'
                    }}>
                      <span style={{ color: '#4a5568' }}>{item.name} x {item.quantity}</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div style={{
                    marginTop: '0.75rem', paddingTop: '0.75rem',
                    borderTop: '2px solid #667eea',
                    display: 'flex', justifyContent: 'space-between',
                    fontWeight: 'bold', fontSize: '1.1rem'
                  }}>
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#667eea' }}>{formatPrice(order.total || order.total_price)}</span>
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
