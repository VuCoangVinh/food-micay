import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, CheckCircle } from 'lucide-react';
import { ordersAPI } from '../services/api.js';
import { formatDateTimeVN, parseSqlDatetimeAsUtc } from '../utils/date.js';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyLatest, setShowOnlyLatest] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return '#48bb78';
      case 'pending':
        return '#ed8936';
      default:
        return '#718096';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'delivered':
        return 'Đã giao';
      case 'pending':
        return 'Đang xử lý';
      default:
        return status;
    }
  };

  useEffect(() => {
    // Kiểm tra nếu có orderId trong query params, set showOnlyLatest ngay
    const orderId = searchParams.get('orderId');
    if (orderId) {
      setShowOnlyLatest(true);
      setShowSuccessMessage(true);
    }
    loadOrders();
  }, [user, searchParams]);

  useEffect(() => {
    // Kiểm tra nếu có thông báo thành công từ location state hoặc query params
    const orderId = searchParams.get('orderId');
    const paymentSuccess = location.state?.paymentSuccess || location.state?.orderSuccess || orderId;
    
    if (paymentSuccess) {
      setShowSuccessMessage(true);
      setShowOnlyLatest(true); // Chỉ hiển thị đơn hàng mới nhất
      // Tự động ẩn sau 5 giây
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state, searchParams]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const orderId = searchParams.get('orderId');
      
      // Nếu có orderId từ query params (sau khi thanh toán), CHỈ load đơn hàng đó và return
      if (orderId) {
        console.log('🔍 Loading specific order by ID:', orderId);
        try {
          const order = await ordersAPI.getById(orderId);
          let items = [];
          try {
            if (typeof order.items === 'string') {
              items = JSON.parse(order.items);
            } else if (Array.isArray(order.items)) {
              items = order.items;
            }
          } catch (e) {
            console.error('Error parsing items:', e);
            items = [];
          }
          
          const transformedOrder = {
            id: order.id,
            date: order.created_at,
            createdAt: order.created_at,
            items: items,
            total: order.total_price,
            total_price: order.total_price,
            totalPrice: order.total_price,
            status: order.status,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_email: order.customer_email,
            table_number: order.table_number,
            number_of_guests: order.number_of_guests,
            payment_method: order.payment_method
          };
          console.log('✅ Setting single order:', transformedOrder.id);
          setOrders([transformedOrder]);
          setShowOnlyLatest(true);
          setLoading(false);
          return; // QUAN TRỌNG: Return ngay để không load tất cả đơn hàng
        } catch (error) {
          console.error('Error loading order by ID:', error);
          setOrders([]);
          setLoading(false);
          return; // Return ngay cả khi có lỗi
        }
      }
      
      // Chỉ chạy các logic dưới nếu KHÔNG có orderId
      if (user && user.id) {
        // Load orders for logged in user
        const userOrders = await ordersAPI.getUserOrders(user.id);
        // Transform API response
        const transformedOrders = userOrders.map(order => {
          let items = [];
          try {
            if (typeof order.items === 'string') {
              items = JSON.parse(order.items);
            } else if (Array.isArray(order.items)) {
              items = order.items;
            }
          } catch (e) {
            console.error('Error parsing items:', e);
            items = [];
          }
          
          return {
            id: order.id,
            date: order.created_at,
            createdAt: order.created_at,
            items: items,
            total: order.total_price,
            total_price: order.total_price,
            totalPrice: order.total_price,
            status: order.status,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_email: order.customer_email,
            table_number: order.table_number,
            number_of_guests: order.number_of_guests,
            payment_method: order.payment_method
          };
        });
        // Sort by date descending (newest first)
        transformedOrders.sort((a, b) => parseSqlDatetimeAsUtc(b.createdAt) - parseSqlDatetimeAsUtc(a.createdAt));
        setOrders(transformedOrders);
      } else {
        // For guests, try to get from localStorage
        const stored = localStorage.getItem('orders');
        if (stored) {
          const allOrders = JSON.parse(stored);
          const guestOrders = allOrders.filter(order => !order.userId || order.userId === null);
          // Sort by date descending
          guestOrders.sort((a, b) => parseSqlDatetimeAsUtc(b.date || b.createdAt) - parseSqlDatetimeAsUtc(a.date || a.createdAt));
          setOrders(guestOrders);
        } else {
          setOrders([]);
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      // Fallback to empty array
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container">
        <h2 style={{
          textAlign: 'center',
          marginBottom: '3rem',
          fontSize: '2.5rem',
          color: 'white',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
        }}>
          {showOnlyLatest ? 'Đơn Hàng Của Bạn' : 'Lịch Sử Đơn Hàng'}
        </h2>

        {/* Success Message */}
        {showSuccessMessage && (
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto 2rem',
            background: '#e6fffa',
            border: '1px solid #9ae6b4',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(72, 187, 120, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle size={24} color="white" />
              </div>
              <div>
                <p style={{ 
                  color: '#48bb78', 
                  fontWeight: '600', 
                  margin: 0,
                  fontSize: '1.1rem'
                }}>
                  {location.state?.paymentSuccess 
                    ? 'Thanh toán thành công!' 
                    : 'Đặt hàng thành công!'}
                </p>
                <p style={{ 
                  color: '#718096', 
                  margin: '0.25rem 0 0 0',
                  fontSize: '0.9rem'
                }}>
                  {location.state?.paymentSuccess 
                    ? 'Đơn hàng của bạn đã được thanh toán thành công.' 
                    : 'Vui lòng thanh toán khi nhận hàng.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/home')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              <Home size={18} />
              Quay lại trang chủ
            </button>
          </div>
        )}

        {loading ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1.2rem', color: '#718096' }}>
              Đang tải đơn hàng...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1.2rem', color: '#718096' }}>
              Bạn chưa có đơn hàng nào
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Nếu có orderId trong query params, chỉ hiển thị đơn hàng đó, không slice */}
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: '2rem',
                  marginBottom: '2rem',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#2d3748' }}>
                      Đơn hàng #{order.id}
                    </h3>
                    <p style={{ color: '#718096' }}>Ngày đặt: {formatDateTimeVN(order.date)}</p>
                  </div>
                  <span style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    background: getStatusColor(order.status),
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: '#4a5568' }}>Chi tiết đơn hàng:</h4>
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      <span style={{ color: '#2d3748' }}>
                        {item.name} x {item.quantity}
                      </span>
                      <span style={{ color: '#2d3748', fontWeight: '600' }}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '2px solid #667eea'
                }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2d3748' }}>
                    Tổng cộng:
                  </span>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

