import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.user.role === 'admin') {
          setError('Vui lòng đăng nhập admin tại trang quản trị');
          setLoading(false);
          return;
        }
        setSuccess(true);
        setTimeout(() => navigate('/home'), 1500);
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
      setLoading(false);
    }
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
      <div style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '3rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 10px 30px rgba(245, 87, 108, 0.4)'
            }}>
              <User size={30} color="white" />
            </div>
            <h2 style={{ color: '#2d3748', marginBottom: '0.5rem', fontSize: '1.8rem' }}>
              Đăng Nhập
            </h2>
            <p style={{ color: '#718096', fontSize: '0.9rem' }}>
              Đăng nhập để xem lịch sử đơn hàng của bạn
            </p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              fontWeight: '600',
              fontSize: '0.9rem',
              padding: '0.5rem 0'
            }}
          >
            <ArrowLeft size={16} />
            Quay lại trang chọn vai trò
          </button>

          {success && (
            <div style={{
              background: '#e6fffa', color: '#48bb78',
              padding: '1rem', borderRadius: '8px',
              marginBottom: '1.5rem', border: '1px solid #9ae6b4',
              textAlign: 'center', fontWeight: '600',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}>
              <span>✓</span> Đăng nhập thành công!
            </div>
          )}

          {error && (
            <div style={{
              background: '#fee', color: '#c33',
              padding: '1rem', borderRadius: '8px',
              marginBottom: '1.5rem', border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
                style={{
                  width: '100%', padding: '0.75rem',
                  border: '2px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '1rem', transition: 'border-color 0.3s', boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu"
                style={{
                  width: '100%', padding: '0.75rem',
                  border: '2px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '1rem', transition: 'border-color 0.3s', boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '1rem', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s', opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 87, 108, 0.4)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          {/* Đăng ký */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <p style={{ color: '#718096' }}>
              Chưa có tài khoản?{' '}
              <Link to="/register" style={{ color: '#f5576c', fontWeight: '600', textDecoration: 'none' }}>
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {/* Tiếp tục không đăng nhập */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: '#a0aec0', fontSize: '0.85rem', marginBottom: '0.75rem' }}>hoặc</p>
            <button
              onClick={() => navigate('/home')}
              style={{
                width: '100%', padding: '0.75rem',
                background: 'transparent', border: '2px solid #e2e8f0',
                borderRadius: '8px', fontSize: '1rem',
                color: '#718096', cursor: 'pointer', fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f5576c'; e.currentTarget.style.color = '#f5576c'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#718096'; }}
            >
              Tiếp tục không cần đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
