import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    // Validate name
    if (!name.trim()) {
      setMessage('Vui lòng nhập họ và tên');
      return;
    }

    if (name.trim().length < 2) {
      setMessage('Họ và tên phải có ít nhất 2 ký tự');
      return;
    }

    if (name.trim().length > 50) {
      setMessage('Họ và tên không được vượt quá 50 ký tự');
      return;
    }

    // Validate email
    if (!validateEmail(email)) {
      setMessage('Email không hợp lệ');
      return;
    }

    // Check if email is already used by another user
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const mockUsers = [
      { id: 1, email: 'admin@foodorder.com' },
      { id: 2, email: 'user@foodorder.com' },
      { id: 3, email: 'test@test.com' }
    ];
    
    const emailExists = [...mockUsers, ...storedUsers].find(
      u => u.email === email.trim().toLowerCase() && u.id !== user?.id
    );
    
    if (emailExists) {
      setMessage('Email này đã được sử dụng bởi tài khoản khác');
      return;
    }

    try {
    // Update user info
      const updatedUser = { 
        ...user, 
        name: name.trim(), 
        email: email.trim().toLowerCase() 
      };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Also update in users list if exists
    const updatedUsers = storedUsers.map(u => 
      u.id === user.id ? updatedUser : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    setMessage('Cập nhật thông tin thành công!');
    setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Đã xảy ra lỗi khi cập nhật. Vui lòng thử lại.');
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '3rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#2d3748', marginBottom: '2rem', textAlign: 'center' }}>Thông Tin Cá Nhân</h2>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '3rem',
              fontWeight: 'bold',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>

          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Shield size={20} color="#667eea" />
              <span style={{ fontWeight: '600', color: '#4a5568' }}>
                Vai trò: {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </span>
            </div>
          </div>

          {message && (
            <div style={{
              background: '#e6fffa',
              color: '#48bb78',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #9ae6b4'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                <User size={18} />
                Họ và tên
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                <Mail size={18} />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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

            <button type="submit" className="btn" style={{ width: '100%' }}>
              Cập Nhật Thông Tin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
