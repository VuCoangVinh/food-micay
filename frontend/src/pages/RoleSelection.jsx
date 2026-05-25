import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User, ArrowRight } from 'lucide-react';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const handleAdminClick = () => {
    // Nếu đã đăng nhập và là admin, chuyển đến dashboard
    if (user && isAdmin()) {
      navigate('/admin/dashboard');
    } else {
      // Nếu chưa đăng nhập hoặc không phải admin, chuyển đến trang login admin
      navigate('/admin/login');
    }
  };

  const handleCustomerClick = () => {
    // Chuyển đến trang chủ cho khách hàng
    navigate('/home');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo/Title */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '4rem',
            color: 'white',
            marginBottom: '1rem',
            fontWeight: '800',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            🍜 FoodOrder
          </h1>
          <p style={{
            fontSize: '1.5rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '300'
          }}>
            Chào mừng bạn đến với hệ thống đặt món
          </p>
        </div>

        {/* Role Selection Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginTop: '3rem'
        }}>
          {/* Admin Card */}
          <div
            onClick={handleAdminClick}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '3rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 30px 80px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
            }}>
              <Shield size={40} color="white" />
            </div>
            <h2 style={{
              fontSize: '1.8rem',
              color: '#2d3748',
              marginBottom: '1rem',
              fontWeight: '700'
            }}>
              Quản Trị Viên
            </h2>
            <p style={{
              color: '#718096',
              marginBottom: '2rem',
              lineHeight: '1.6',
              fontSize: '1rem'
            }}>
              Quản lý menu, đơn hàng và người dùng của hệ thống
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#667eea',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              <span>Tiếp tục</span>
              <ArrowRight size={20} />
            </div>
          </div>

          {/* Customer Card */}
          <div
            onClick={handleCustomerClick}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '3rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 30px 80px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 30px rgba(245, 87, 108, 0.4)'
            }}>
              <User size={40} color="white" />
            </div>
            <h2 style={{
              fontSize: '1.8rem',
              color: '#2d3748',
              marginBottom: '1rem',
              fontWeight: '700'
            }}>
              Khách Hàng
            </h2>
            <p style={{
              color: '#718096',
              marginBottom: '2rem',
              lineHeight: '1.6',
              fontSize: '1rem'
            }}>
              Xem menu, đặt món và quản lý đơn hàng của bạn
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#f5576c',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              <span>Tiếp tục</span>
              <ArrowRight size={20} />
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p style={{
          marginTop: '3rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.9rem'
        }}>
          Vui lòng chọn vai trò của bạn để tiếp tục
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;

