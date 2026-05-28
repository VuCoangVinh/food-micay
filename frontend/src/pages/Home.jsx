import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTable } from '../contexts/TableContext';
import { menuAPI } from '../services/api.js';

const Home = () => {
  const [searchParams] = useSearchParams();
  const { setTable } = useTable();
  const [tableLoaded, setTableLoaded] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
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
      const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://food-micay.onrender.com';
      return `${backendUrl}${imagePath}`;
    }
    // If it's a local public path (/images/...), use it directly
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    // Fallback
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };
  
  // Load menu items from API
  useEffect(() => {
    const loadMenuItems = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const items = await menuAPI.getAll();
        if (items && items.length > 0) {
          setMenuItems(items);
          localStorage.setItem('menuItems', JSON.stringify(items));
          return;
        }

        throw new Error('Không có dữ liệu menu từ API');
      } catch (error) {
        console.error('Error loading menu items:', error);
        const storedMenu = localStorage.getItem('menuItems');
        if (storedMenu) {
          setMenuItems(JSON.parse(storedMenu));
        } else {
          setMenuItems([]);
          setLoadError('Không thể tải danh sách món ăn. Vui lòng kiểm tra kết nối đến backend.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadMenuItems();
  }, []);

  // Get featured items (first 6 items or all if less than 6)
  const featuredItems = menuItems.slice(0, 6);

  useEffect(() => {
    // Check URL for table parameter from QR code
    const tableId = searchParams.get('table');
    if (tableId && !tableLoaded) {
      setTableLoaded(true);
      // Load table from API
      const loadTableFromAPI = async () => {
        try {
          const { tablesAPI } = await import('../services/api.js');
          const table = await tablesAPI.getById(tableId);
          const tableData = {
            id: table.id,
            number: table.name,
            capacity: table.capacity,
            status: table.status
          };
          setTable(tableData);
          console.log('Table loaded from QR code:', tableData);
        } catch (error) {
          console.error('Error loading table from API:', error);
          // Fallback to basic table data
          const tableData = {
            id: parseInt(tableId),
            number: `Bàn ${tableId}`,
            capacity: 4,
            status: 'available'
          };
          setTable(tableData);
        }
      };
      loadTableFromAPI();
    }

  }, [searchParams, setTable, tableLoaded]);

  // Add to cart function
  const addToCart = (item) => {
    try {
      // Support both logged in and guest users
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const cartKey = user ? `cart_${user.id}` : 'cart_guest';
      
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const existingItem = cart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          ...item,
          quantity: 1
        });
      }
      
      localStorage.setItem(cartKey, JSON.stringify(cart));
      
      // Show success message
      alert(`✅ Đã thêm ${item.name} vào giỏ hàng!`);
      
      // Update cart count in header (if exists)
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('❌ Có lỗi xảy ra khi thêm vào giỏ hàng');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>🍜 FoodOrder</h1>
          <p>Ẩm thực Việt Nam - Hương vị truyền thống, chất lượng hiện đại</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/menu" className="btn">
              Xem Thực Đơn
            </Link>
            <Link to="/cart" className="btn btn-secondary">
              Giỏ Hàng
            </Link>
          </div>
        </div>
      </section>

      {loadError && (
        <div style={{
          background: '#fff5f5',
          color: '#c53030',
          padding: '1rem',
          borderRadius: '10px',
          margin: '1.5rem auto',
          border: '1px solid #fed7d7',
          textAlign: 'center',
          maxWidth: '900px'
        }}>
          {loadError}
        </div>
      )}

      {/* Featured Items */}
      <section className="section">
        <div className="container">
          <h2>Món Ăn Nổi Bật</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Đang tải menu...</p>
            </div>
          ) : featuredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Chưa có món ăn nào. Vui lòng quay lại sau!</p>
            </div>
          ) : (
            <div className="grid">
              {featuredItems.map((item) => (
              <div key={item.id} className="food-card">
                <img 
                  src={getImageUrl(item.image)} 
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                <div className="food-card-content">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="food-card-footer">
                    <span className="price">{formatPrice(item.price)}</span>
                    <button 
                      className="add-btn"
                      onClick={() => addToCart(item)}
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/menu" className="btn">
              Xem Tất Cả Món Ăn ({menuItems.length} món)
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <h2>Tại Sao Chọn Chúng Tôi?</h2>
          <div className="grid">
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 2rem',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⭐</div>
              <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700' }}>Chất Lượng Cao</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>Nguyên liệu tươi ngon, chế biến cẩn thận theo công thức truyền thống</p>
            </div>
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 2rem',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🍽️</div>
              <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700' }}>Phục Vụ Nhanh</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>Món ăn được phục vụ nhanh chóng, đảm bảo còn nóng hổi khi đến bàn</p>
            </div>
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 2rem',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏪</div>
              <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700' }}>Không Gian Đẹp</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>Không gian nhà hàng sang trọng, thoáng mát, phù hợp cho mọi dịp</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;