import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTable } from '../contexts/TableContext';
import { CreditCard, Phone, Users, Home } from 'lucide-react';
import { ordersAPI } from '../services/api.js';

const Checkout = () => {
  const { user } = useAuth();
  const { currentTable } = useTable();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cartLoaded, setCartLoaded] = useState(false); // Track if cart has been loaded
  const [formData, setFormData] = useState({
    phone: '',
    tableNumber: currentTable?.number || '',
    numberOfGuests: '1',
    paymentMethod: 'cash' // Only cash payment
  });

  useEffect(() => {
    // Update table number when currentTable changes
    if (currentTable) {
      setFormData(prev => ({
        ...prev,
        tableNumber: currentTable.number
      }));
    }
  }, [currentTable]);

  useEffect(() => {
    // Load cart from localStorage - support both logged in and guest users
    const cartKey = user ? `cart_${user.id}` : 'cart_guest';
    const storedCart = localStorage.getItem(cartKey);
    if (storedCart) {
      const items = JSON.parse(storedCart);
      if (items.length === 0) {
        navigate('/cart');
        return;
      }
      setCartItems(items);
    } else {
      navigate('/cart');
      return;
    }
    setCartLoaded(true); // Mark cart as loaded
  }, [user, navigate]);

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate phone number only if provided (optional field)
    if (formData.phone && formData.phone.trim() && !validatePhone(formData.phone)) {
      setMessage('Số điện thoại không hợp lệ (10-11 chữ số)');
      setLoading(false);
      return;
    }

    if (!formData.tableNumber || !formData.tableNumber.trim()) {
      setMessage('Vui lòng nhập số bàn');
      setLoading(false);
      return;
    }

    if (formData.tableNumber.trim().length > 20) {
      setMessage('Số bàn không được vượt quá 20 ký tự');
      setLoading(false);
      return;
    }

    // Validate number of guests
    const numGuests = parseInt(formData.numberOfGuests);
    if (isNaN(numGuests) || numGuests < 1 || numGuests > 20) {
      setMessage('Số khách phải từ 1 đến 20 người');
      setLoading(false);
      return;
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Create order via API
      const orderData = {
        userId: user?.id || null,
        tableId: currentTable?.id || null,
        customerName: user?.name || 'Khách hàng',
        customerEmail: user?.email || null,
        customerPhone: formData.phone && formData.phone.trim() ? formData.phone.trim() : null,
        tableNumber: formData.tableNumber.trim(),
        numberOfGuests: parseInt(formData.numberOfGuests),
        items: cartItems,
        totalPrice: getTotalPrice(),
        paymentMethod: formData.paymentMethod
      };

      const createdOrder = await ordersAPI.create(orderData);

      // Format order for frontend
      // Parse items safely - could be string or already an object
      let items = cartItems; // Use cartItems as fallback
      try {
        if (typeof createdOrder.items === 'string') {
          items = JSON.parse(createdOrder.items);
        } else if (Array.isArray(createdOrder.items)) {
          items = createdOrder.items;
        }
      } catch (parseError) {
        console.warn('Error parsing items, using cartItems:', parseError);
        items = cartItems;
      }

      const order = {
        id: createdOrder.id,
        userId: createdOrder.user_id || null,
        userName: createdOrder.customer_name || user?.name || 'Khách hàng',
        userEmail: createdOrder.customer_email || user?.email || null,
        userPhone: createdOrder.customer_phone || formData.phone.trim(),
        tableNumber: createdOrder.table_number || formData.tableNumber.trim(),
        numberOfGuests: createdOrder.number_of_guests || parseInt(formData.numberOfGuests),
        items: items,
        total: createdOrder.total_price || getTotalPrice(),
        paymentMethod: createdOrder.payment_method || formData.paymentMethod,
        status: createdOrder.status || 'pending',
        createdAt: createdOrder.created_at || new Date().toISOString()
      };
      
      // Save order to localStorage for payment page
      localStorage.setItem('lastOrder', JSON.stringify(order));

      // Cash payment - chỉ cần tạo order, không cần payment
      setLoading(false);
      setMessage('Đơn hàng đã được tạo! Đang chuyển đến trang thanh toán thành công...');

      // Clear cart
      const cartKey = user ? `cart_${user.id}` : 'cart_guest';
      localStorage.removeItem(cartKey);

      setTimeout(() => {
        navigate(`/payment/success?orderId=${order.id}`);
      }, 1500);
      return;
    } catch (error) {
      console.error('Error creating order:', error);
      // Provide more specific error messages
      let errorMessage = 'Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại.';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa (http://localhost:3001).';
      } else if (error.message.includes('Giỏ hàng không được để trống')) {
        errorMessage = 'Giỏ hàng của bạn đang trống. Vui lòng thêm món ăn vào giỏ hàng.';
      } else if (error.message.includes('Tổng giá không hợp lệ')) {
        errorMessage = 'Tổng giá đơn hàng không hợp lệ. Vui lòng kiểm tra lại giỏ hàng.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage(errorMessage);
      setLoading(false);
    }
  };

  // Show loading state while cart is being loaded
  if (!cartLoaded) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '3rem' }}>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }
  
  // If cart is empty but we have a success message, show the success message
  // This prevents blank screen after payment success
  if (cartItems.length === 0 && (message.includes('thành công') || loading)) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '3rem' }}>
          {message && (
            <div style={{
              background: message.includes('thành công') ? '#e6fffa' : '#fee',
              color: message.includes('thành công') ? '#48bb78' : '#c33',
              padding: '2rem',
              borderRadius: '12px',
              border: `1px solid ${message.includes('thành công') ? '#9ae6b4' : '#fcc'}`,
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Don't render checkout form if cart is empty (will redirect via useEffect above)
  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ color: '#2d3748', marginBottom: '2rem', textAlign: 'center' }}>Thanh Toán</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Order Summary */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            height: 'fit-content',
            position: 'sticky',
            top: '100px'
          }}>
            <h3 style={{ color: '#2d3748', marginBottom: '1.5rem' }}>Đơn Hàng Của Bạn</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '1rem 0',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <div>
                    <p style={{ fontWeight: '600', color: '#2d3748', marginBottom: '0.25rem' }}>
                      {item.name}
                    </p>
                    <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                      {formatPrice(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <span style={{ fontWeight: '600', color: '#2d3748' }}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              paddingTop: '1rem',
              borderTop: '2px solid #667eea',
              marginTop: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#718096' }}>Tạm tính:</span>
                <span style={{ color: '#718096' }}>{formatPrice(getTotalPrice())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#718096' }}>Phí phục vụ:</span>
                <span style={{ color: '#718096' }}>{formatPrice(0)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: '#667eea',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '2px solid #e2e8f0'
              }}>
                <span>Tổng cộng:</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            {message && (
              <div style={{
                background: message.includes('thành công') ? '#e6fffa' : '#fee',
                color: message.includes('thành công') ? '#48bb78' : '#c33',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                border: `1px solid ${message.includes('thành công') ? '#9ae6b4' : '#fcc'}`,
                textAlign: 'center',
                fontWeight: '600'
              }}>
                <div style={{ marginBottom: message.includes('thành công') ? '1rem' : '0' }}>
                  {message}
                </div>
                {message.includes('thành công') && (
                  <button
                    onClick={() => navigate('/home')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
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
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Restaurant Table Information */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#2d3748', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} />
                  Thông Tin Đặt Bàn
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                    <Phone size={16} />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0901234567"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                  <p style={{ 
                    color: '#718096', 
                    fontSize: '0.85rem', 
                    marginTop: '0.5rem',
                    marginBottom: 0,
                    fontStyle: 'italic'
                  }}>
                    💡 Nếu muốn tích điểm thưởng để đổi mã giảm giá cho lần sau, vui lòng điền số điện thoại
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                      Số bàn *
                    </label>
                    <input
                      type="text"
                      name="tableNumber"
                      value={formData.tableNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="Ví dụ: Bàn 1, Bàn 5"
                      disabled={!!currentTable}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: currentTable ? '#f7fafc' : 'white',
                        cursor: currentTable ? 'not-allowed' : 'text'
                      }}
                    />
                    {currentTable && (
                      <p style={{ fontSize: '0.85rem', color: '#48bb78', marginTop: '0.25rem' }}>
                        ✓ Số bàn đã được tự động điền từ QR code
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                      <Users size={16} />
                      Số khách *
                    </label>
                    <select
                      name="numberOfGuests"
                      value={formData.numberOfGuests}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: 'white'
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'người' : 'người'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#2d3748', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={20} />
                  Phương Thức Thanh Toán
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    border: `2px solid ${formData.paymentMethod === 'cash' ? '#667eea' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: formData.paymentMethod === 'cash' ? '#f0f4ff' : 'white',
                    transition: 'all 0.3s'
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={handleInputChange}
                      style={{ margin: 0 }}
                    />
                    <div>
                      <span style={{ fontWeight: '600' }}>Thanh toán tiền mặt tại nhà hàng</span>
                      <p style={{ color: '#718096', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                        Thanh toán trực tiếp khi nhận món
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Quay Lại Giỏ Hàng
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn"
                  style={{ flex: 1 }}
                >
                  {loading ? 'Đang xử lý...' : `Hoàn Tất Đặt Hàng - ${formatPrice(getTotalPrice())}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

