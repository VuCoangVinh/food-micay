import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Settings, Table, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTable } from '../contexts/TableContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { currentTable } = useTable();
  const [cartCount, setCartCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/home');
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  // Update cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      const cartKey = user ? `cart_${user.id}` : 'cart_guest';
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, [user]);

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
            <Link to="/home" className={isActive('/home') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
              Trang Chủ
            </Link>
            <Link to="/menu" className={isActive('/menu') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
              Thực Đơn
            </Link>
            <Link to="/cart" className={isActive('/cart') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
              Giỏ Hàng
            </Link>
            <Link to="/checkout" className={isActive('/checkout') ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
              Thanh Toán
            </Link>
          </nav>
          
          <div className="header-right">
            <Link to="/cart" className="cart-btn">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="cart-count">{cartCount}</span>
              )}
            </Link>
            
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
        <Link 
          to="/home" 
          className={isActive('/home') ? 'active' : ''} 
          onClick={() => setShowMobileMenu(false)}
        >
          Trang Chủ
        </Link>
        <Link 
          to="/menu" 
          className={isActive('/menu') ? 'active' : ''} 
          onClick={() => setShowMobileMenu(false)}
        >
          Thực Đơn
        </Link>
        <Link 
          to="/cart" 
          className={isActive('/cart') ? 'active' : ''} 
          onClick={() => setShowMobileMenu(false)}
        >
          Giỏ Hàng {cartCount > 0 && `(${cartCount})`}
        </Link>
        <Link 
          to="/checkout" 
          className={isActive('/checkout') ? 'active' : ''} 
          onClick={() => setShowMobileMenu(false)}
        >
          Thanh Toán
        </Link>
        {user && (
          <>
            <Link 
              to="/profile" 
              className={isActive('/profile') ? 'active' : ''} 
              onClick={() => setShowMobileMenu(false)}
            >
              <User size={18} /> Tài Khoản
            </Link>
            <Link 
              to="/order-history" 
              className={isActive('/order-history') ? 'active' : ''} 
              onClick={() => setShowMobileMenu(false)}
            >
              Lịch Sử Đơn Hàng
            </Link>
          </>
        )}
      </nav>
      
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
      
      {showUserMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;