import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate email format
    if (!validateEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }

    // Validate password
    if (!password || password.length === 0) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Kiểm tra xem user có phải admin không
        if (result.user.role === 'admin') {
          setSuccess(true);
          setTimeout(() => {
            navigate('/admin/dashboard');
          }, 1500);
        } else {
          setError('Tài khoản này không có quyền quản trị viên');
          setLoading(false);
        }
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
            }}>
              <Shield size={30} color="white" />
            </div>
            <h2 style={{ color: '#2d3748', marginBottom: '0.5rem', fontSize: '1.8rem' }}>
              Đăng Nhập 
            </h2>
            <p style={{ color: '#718096', fontSize: '0.9rem' }}>
              Vui lòng đăng nhập với tài khoản quản trị viên
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
              background: '#e6fffa',
              color: '#48bb78',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #9ae6b4',
              textAlign: 'center',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <span>✓</span>
              Đăng nhập thành công! 
            </div>
          )}

          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #fcc'
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
                placeholder="admin@foodorder.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.3s'
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
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                marginBottom: '1rem',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập Admin'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px', fontSize: '0.9rem' }}>
            <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>Thông tin đăng nhập:</p>
            <p style={{ marginBottom: '0.25rem', color: '#4a5568' }}>
              Email: <strong>admin@foodorder.com</strong>
            </p>
            <p style={{ color: '#4a5568' }}>
              Mật khẩu: <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

