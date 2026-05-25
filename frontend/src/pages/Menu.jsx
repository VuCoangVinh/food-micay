import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { menuAPI } from '../services/api.js';

const Menu = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [menuItems, setMenuItems] = useState([]);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 6; // Số món ăn mỗi trang

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
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    setLoading(true);
    try {
      // Try to load from API first
      const items = await menuAPI.getAll();
      if (items && items.length > 0) {
        setMenuItems(items);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error loading menu from API, falling back to localStorage:', error);
    }
    
    // Fallback to localStorage
    try {
    const stored = localStorage.getItem('menuItems');
    if (stored) {
        let items = JSON.parse(stored);
        
        // Xóa các món không mong muốn
        const itemsBeforeDelete = items.length;
        items = items.filter(item => 
          item.name !== "Bún Bò" && 
          item.name !== "Bún Bò Huế" &&
          item.name !== "Chả Cá" &&
          item.name !== "Chả Cá Lã Vọng"
        );
        if (items.length < itemsBeforeDelete) {
          localStorage.setItem('menuItems', JSON.stringify(items));
        }
        
        setMenuItems(items);
    } else {
        // Load default items
        loadDefaultItems();
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      loadDefaultItems();
    } finally {
      setLoading(false);
    }
  };

  // Fallback function for default items (only used if no data exists)
  const loadDefaultItems = () => {
      // Default menu items if admin hasn't added any
      const defaultItems = [
    {
      id: 1,
      name: "Phở Bò Tái",
      description: "Phở bò truyền thống với thịt bò tái tươi ngon",
      price: 75000,
      category: "main",
        image: "/images/pho_bo.jpg"
      },
      {
        id: 1.5,
        name: "Cơm Tấm Sài Gòn",
        description: "Cơm tấm với sườn nướng, chả trứng và đồ chua",
        price: 60000,
        category: "main",
        image: "/images/com_tam.jpg"
    },
    {
      id: 2,
        name: "Bún Mọc",
        description: "Bún mọc thơm ngon với thịt viên và nước dùng đậm đà",
        price: 50000,
      category: "main",
        image: "/images/bunmoc.jpg"
    },
    {
      id: 3,
        name: "Bún Chả",
        description: "Bún chả Hà Nội với thịt nướng thơm lừng",
      price: 60000,
      category: "main",
        image: "/images/buncha.jpg"
    },
    {
      id: 4,
      name: "Gỏi Cuốn Tôm Thịt",
      description: "Gỏi cuốn tươi ngon với tôm, thịt, rau sống và bún",
      price: 45000,
      category: "main",
        image: "/images/goi_cuon.jpg"
    },
    {
      id: 5,
        name: "Cháo Lòng",
        description: "Cháo lòng nóng hổi với lòng heo tươi ngon",
        price: 40000,
        category: "main",
        image: "/images/chaolong.jpg"
    },
    {
        id: 10,
      name: "Cá Nướng Muối Ớt",
      description: "Cá nướng muối ớt cay nồng thơm ngon",
      price: 95000,
      category: "main",
        image: "/images/ca_nuong.jpg"
      },
      {
        id: 11,
        name: "Sườn Nướng",
        description: "Sườn heo nướng thơm lừng với sốt đặc biệt",
      price: 85000,
      category: "main",
        image: "/images/suon_nuong.jpg"
      },
      {
        id: 12,
        name: "Chè Bưởi",
        description: "Chè bưởi mát lạnh, thanh mát",
        price: 25000,
        category: "dessert",
        image: "/images/che_buoi.jpg"
      },
      {
        id: 13,
        name: "Nhãn Trần",
        description: "Nhãn trần tươi ngon, ngọt thanh",
        price: 20000,
        category: "dessert",
        image: "/images/nhan_tran.jpg"
      },
      {
        id: 14,
        name: "Hoa Quả",
        description: "Đĩa hoa quả tươi ngon, đa dạng",
        price: 35000,
        category: "dessert",
        image: "/images/hoa_qua.jpg"
      },
      {
        id: 15,
        name: "Sữa Đậu Nành",
        description: "Sữa đậu nành thơm ngon, bổ dưỡng",
        price: 12000,
        category: "drink",
        image: "/images/sua_dau_nanh.jpg"
    },
    {
      id: 8,
        name: "Bánh Flan",
        description: "Bánh flan caramel mềm mịn, ngọt ngào",
        price: 30000,
      category: "dessert",
        image: "/images/flan.jpg"
    },
    {
      id: 9,
        name: "Cà Phê",
        description: "Cà phê đậm đà, thơm ngon",
        price: 15000,
        category: "drink",
        image: "/images/cafe.jpg"
      },
      {
        id: 16,
      name: "Trà Đá",
      description: "Trà đá mát lạnh giải nhiệt",
      price: 10000,
      category: "drink",
        image: "/images/tra_da.jpg"
    }
      ];
      setMenuItems(defaultItems);
      localStorage.setItem('menuItems', JSON.stringify(defaultItems));
  };

  const addToCart = (item) => {
    // Support both logged in and guest users
    const cartKey = user ? `cart_${user.id}` : 'cart_guest';
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const existingItem = cart.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        ...item,
        quantity: 1,
        image: item.image || 'https://via.placeholder.com/80x80?text=Food'
      });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    // Notify other components (Header) that cart changed
    window.dispatchEvent(new Event('cartUpdated'));

    // Show local success message
    setMessage(`Đã thêm ${item.name} vào giỏ hàng!`);
    setTimeout(() => setMessage(''), 2000);
  };

  const categories = [
    { id: 'all', name: 'Tất Cả' },
    { id: 'main', name: 'Món Chính' },
    { id: 'dessert', name: 'Tráng Miệng' },
    { id: 'drink', name: 'Đồ Uống' }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  // Phân trang
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset về trang 1 khi đổi category
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="section">
      <div className="container">
        <h2>Thực Đơn</h2>
        
        {message && (
          <div style={{
            background: '#e6fffa',
            color: '#48bb78',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #9ae6b4',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            {message}
          </div>
        )}
        
        {/* Category Filter */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center', 
          marginBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '0.5rem 1rem',
                border: '2px solid #ff6b35',
                background: selectedCategory === category.id ? '#ff6b35' : 'white',
                color: selectedCategory === category.id ? 'white' : '#ff6b35',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="grid">
          {paginatedItems.map((item) => (
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

        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Không có món ăn nào trong danh mục này.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '3rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                border: '2px solid #e2e8f0',
                background: currentPage === 1 ? '#f7fafc' : 'white',
                color: currentPage === 1 ? '#cbd5e0' : '#2d3748',
                borderRadius: '8px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s',
                opacity: currentPage === 1 ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = '#f7fafc';
                  e.currentTarget.style.borderColor = '#667eea';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }
              }}
            >
              <ChevronLeft size={18} />
              Trước
            </button>

            {/* Page Numbers */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Hiển thị tối đa 5 số trang, với logic để hiển thị ... khi cần
                if (
                  totalPages <= 7 ||
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        minWidth: '40px',
                        height: '40px',
                        padding: '0.5rem',
                        border: '2px solid',
                        borderColor: currentPage === page ? '#667eea' : '#e2e8f0',
                        background: currentPage === page ? '#667eea' : 'white',
                        color: currentPage === page ? 'white' : '#2d3748',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== page) {
                          e.currentTarget.style.background = '#f7fafc';
                          e.currentTarget.style.borderColor = '#667eea';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== page) {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }
                      }}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <span key={page} style={{ color: '#718096', padding: '0 0.25rem' }}>
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                border: '2px solid #e2e8f0',
                background: currentPage === totalPages ? '#f7fafc' : 'white',
                color: currentPage === totalPages ? '#cbd5e0' : '#2d3748',
                borderRadius: '8px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s',
                opacity: currentPage === totalPages ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = '#f7fafc';
                  e.currentTarget.style.borderColor = '#667eea';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }
              }}
            >
              Sau
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Page Info */}
        {filteredItems.length > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            color: '#718096',
            fontSize: '0.9rem'
          }}>
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} trong tổng số {filteredItems.length} món ăn
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;