import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [message, setMessage] = useState('');

  // Helper function to get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return 'https://via.placeholder.com/300x200?text=No+Image';
    }
    // If it's already a full URL (http/https), use it directly
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // If it's a base64 image, use it directly
    if (imagePath.startsWith('data:image/')) {
      return imagePath;
    }
    // If it's an upload path from backend, add backend URL
    if (imagePath.startsWith('/uploads/')) {
      const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
      return `${backendUrl}${imagePath}`;
    }
    // If it's a local public path (/images/...), use it directly
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    // Fallback
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  useEffect(() => {
    // Load cart from localStorage - support both logged in and guest users
    const cartKey = user ? `cart_${user.id}` : 'cart_guest';
    const storedCart = localStorage.getItem(cartKey);
    if (storedCart) {
      let items = JSON.parse(storedCart);
      
      // Mapping tên món với ảnh local
      const imageMapping = {
        "Phở Bò Tái": "/images/pho_bo.jpg",
        "Cơm Tấm Sài Gòn": "/images/com_tam.jpg",
        "Bún Mọc": "/images/bunmoc.jpg",
        "Bún Chả": "/images/buncha.jpg",
        "Gỏi Cuốn Tôm Thịt": "/images/goi_cuon.jpg",
        "Cháo Lòng": "/images/chaolong.jpg",
        "Cá Nướng Muối Ớt": "/images/ca_nuong.jpg",
        "Sườn Nướng": "/images/suon_nuong.jpg",
        "Thịt Nướng BBQ": "/images/suon_nuong.jpg",
        "Bánh Flan": "/images/flan.jpg",
        "Flan Caramel": "/images/flan.jpg",
        "Chè Bưởi": "/images/che_buoi.jpg",
        "Nhãn Trần": "/images/nhan_tran.jpg",
        "Hoa Quả": "/images/hoa_qua.jpg",
        "Sữa Đậu Nành": "/images/sua_dau_nanh.jpg",
        "Cà Phê": "/images/cafe.jpg",
        "Trà Đá": "/images/tra_da.jpg",
        "Chè Ba Màu": "/images/che_buoi.jpg"
      };
      
      // Cập nhật ảnh cho các món trong giỏ hàng
      let updated = false;
      
      // Thay thế "Chè Ba Màu" bằng "Chè Bưởi" nếu có
      items = items.map(item => {
        if (item.name === "Chè Ba Màu") {
          updated = true;
          return {
            ...item,
            name: "Chè Bưởi",
            image: "/images/che_buoi.jpg"
          };
        }
        return item;
      });
      items = items.map(item => {
        // Nếu món có trong mapping và chưa có ảnh hoặc có placeholder
        if (imageMapping[item.name] && (!item.image || item.image.includes('placeholder') || item.image.includes('via.placeholder'))) {
          updated = true;
          return { ...item, image: imageMapping[item.name] };
        }
        // Nếu món không có ảnh, lấy từ menu items
        if (!item.image || item.image.includes('placeholder') || item.image.includes('via.placeholder')) {
          const menuItems = JSON.parse(localStorage.getItem('menuItems') || '[]');
          const menuItem = menuItems.find(menu => menu.id === item.id || menu.name === item.name);
          if (menuItem && menuItem.image) {
            updated = true;
            return { ...item, image: menuItem.image };
          }
        }
        return item;
      });
      
      if (updated) {
        localStorage.setItem(cartKey, JSON.stringify(items));
      }
      
      // Debug: log để kiểm tra ảnh
      console.log('Cart items with images:', items.map(item => ({ name: item.name, image: item.image })));
      
      setCartItems(items);
    }
  }, [user]);

  const saveCart = (items) => {
    setCartItems(items);
    const cartKey = user ? `cart_${user.id}` : 'cart_guest';
    localStorage.setItem(cartKey, JSON.stringify(items));
  };

  const updateQuantity = (id, newQuantity) => {
    // Validate quantity
    if (newQuantity <= 0) {
      const updated = cartItems.filter(item => item.id !== id);
      saveCart(updated);
      setMessage('Đã xóa món ăn khỏi giỏ hàng');
      setTimeout(() => setMessage(''), 2000);
    } else if (newQuantity > 99) {
      setMessage('Số lượng tối đa là 99');
      setTimeout(() => setMessage(''), 2000);
    } else {
      const updated = cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      saveCart(updated);
    }
  };

  const removeItem = (id) => {
    const updated = cartItems.filter(item => item.id !== id);
    saveCart(updated);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setMessage('Giỏ hàng của bạn đang trống!');
      return;
    }

    // Navigate to checkout page (no login required)
    navigate('/checkout');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (cartItems.length === 0) {
    return (
      <div className="section">
        <div className="container">
          <div className="cart">
            <h2 style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Giỏ Hàng Trống</h2>
            <p>Bạn chưa có món ăn nào trong giỏ hàng.</p>
            <a href="/menu" className="btn">Xem Thực Đơn</a>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="section">
      <div className="container">
        <div className="cart">
          <h2 style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Giỏ Hàng ({cartItems.length} món)</h2>
          
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
              {message}
            </div>
          )}
          
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item" style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
              padding: '1.5rem',
              marginBottom: '1rem',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              borderBottom: '1px solid #eee',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                flexShrink: 0,
                width: '120px',
                height: '120px',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#f8f9fa'
              }}>
              <img 
                  src={getImageUrl(item.image) || '/images/pho_bo.jpg'} 
                alt={item.name}
                  onError={(e) => {
                    // Fallback nếu ảnh không load được
                    e.target.src = 'https://via.placeholder.com/120x120?text=Food';
                  }}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    display: 'block'
                  }}
              />
              </div>
              <div className="cart-item-info" style={{ 
                flex: 1,
                minWidth: 0
              }}>
                <h3 style={{ 
                  marginBottom: '0.5rem', 
                  fontSize: '1.25rem', 
                  color: '#2d3748',
                  fontWeight: '700',
                  lineHeight: '1.4'
                }}>
                  {item.name}
                </h3>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#667eea', 
                  fontWeight: '600', 
                  marginBottom: '0.25rem'
                }}>
                  {formatPrice(item.price)} / món
                </p>
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: '#718096',
                  marginTop: '0.5rem'
                }}>
                  Tổng: <span style={{ color: '#2d3748', fontWeight: '600' }}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </p>
              </div>
              <div className="cart-item-controls" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                flexShrink: 0
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  background: '#f8f9fa',
                  padding: '0.5rem',
                  borderRadius: '12px'
                }}>
                <button 
                  className="quantity-btn"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#4a5568',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#667eea';
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#4a5568';
                    }}
                >
                  -
                </button>
                  <span className="quantity" style={{
                    fontWeight: 'bold',
                    minWidth: '30px',
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    color: '#2d3748'
                  }}>
                    {item.quantity}
                  </span>
                <button 
                  className="quantity-btn"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#4a5568',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#667eea';
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#4a5568';
                    }}
                >
                  +
                </button>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: '#ff4757',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.3s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ff3742';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(255, 71, 87, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ff4757';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
          
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            marginTop: '2rem',
            border: '2px solid #e2e8f0'
          }}>
            <div className="cart-total" style={{
              textAlign: 'right',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <div style={{
                fontSize: '1.1rem',
                color: '#718096',
                marginBottom: '0.5rem'
              }}>
                Tổng cộng:
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {formatPrice(getTotalPrice())}
              </div>
          </div>
          
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
            <button 
              onClick={handleCheckout}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2.5rem',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  position: 'relative',
                  overflow: 'hidden'
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
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              Thanh Toán
            </button>
              <a 
                href="/menu" 
                style={{
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  padding: '1rem 2.5rem',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#667eea';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#667eea';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Tiếp Tục Chọn Món
            </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;