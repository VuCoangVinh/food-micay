import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, History, Menu, X, Table, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTable } from '../contexts/TableContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentTable } = useTable();
  const [cartCount, setCartCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/home');
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  // Đóng user menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update cart count từ localStorage
  useEffect(() => {
    const updateCartCount = (event) => {
      if (event && event.detail && typeof event.detail.count === 'number') {
        setCartCount(event.detail.count);
        return;
      }
      const cartKey = user ? `cart_${user.id}` : 'cart_guest';
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('storage', updateCartCount);
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, [user, location]);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <Link to="/home" className="logo" onClick={() => setShowMobileMenu(false)}>
              🍜 FoodOrder
            </Link>
            {currentTable && (
              <div className="table-badge">
                <Table size={16} />
                <span>{currentTable.number}</span>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="nav desktop-nav">
            <Link to="/home" className={isActive('/home') ? 'active' : ''}>Trang Chủ</Link>
            <Link to="/menu" className={isActive('/menu') ? 'active' : ''}>Thực Đơn</Link>
            <Link to="/cart" className={isActive('/cart') ? 'active' : ''}>Giỏ Hàng</Link>
            <Link to="/checkout" className={isActive('/checkout') ? 'active' : ''}>Thanh Toán</Link>
          </nav>

          <div className="header-right">
            {/* Cart */}
            <Link to="/cart" className="cart-btn">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>

            {/* User khu vực */}
            {user ? (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  className="user-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(102,126,234,0.1)',
                    border: '2px solid #667eea',
                    borderRadius: '20px',
                    padding: '0.4rem 0.9rem',
                    color: '#667eea',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  <User size={16} />
                  <span className="user-btn-name" style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </span>
                  <ChevronDown size={14} />
                </button>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    minWidth: '180px',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    <Link
                      to="/order-history"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.75rem 1rem', color: '#2d3748',
                        textDecoration: 'none', fontSize: '0.9rem',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <History size={16} color="#667eea" /> Lịch sử đơn hàng
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        width: '100%', padding: '0.75rem 1rem',
                        background: 'transparent', border: 'none',
                        color: '#e53e3e', cursor: 'pointer', fontSize: '0.9rem',
                        textAlign: 'left'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Link
                  to="/login"
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    border: '2px solid #667eea',
                    color: '#667eea',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className={`mobile-nav ${showMobileMenu ? 'active' : ''}`}>
        <Link to="/home" className={isActive('/home') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>Trang Chủ</Link>
        <Link to="/menu" className={isActive('/menu') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>Thực Đơn</Link>
        <Link to="/cart" className={isActive('/cart') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
          Giỏ Hàng {cartCount > 0 && `(${cartCount})`}
        </Link>
        <Link to="/checkout" className={isActive('/checkout') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>Thanh Toán</Link>

        {user ? (
          <>
            <Link to="/order-history" className={isActive('/order-history') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
              Lịch Sử Đơn Hàng
            </Link>
            <Link to="/profile" className={isActive('/profile') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
              Hồ Sơ Cá Nhân
            </Link>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.75rem 1.5rem', color: '#e53e3e', fontSize: '1rem', width: '100%' }}
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={isActive('/login') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>Đăng nhập</Link>
            <Link to="/register" className={isActive('/register') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>Đăng ký</Link>
          </>
        )}
      </nav>

      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)} />
      )}
    </header>
  );
};

export default Header;
