import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Trash2, Search, Filter, X, Users as UsersIcon } from 'lucide-react';
import { usersAPI } from '../../services/api.js';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const getUserStats = () => {
    const stats = {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      regularUsers: users.filter(u => u.role === 'user').length
    };
    return stats;
  };

  const stats = getUserStats();

  const loadUsers = async () => {
    try {
      const usersData = await usersAPI.getAll();
      if (usersData && Array.isArray(usersData)) {
        setUsers(usersData);
        return;
      }
    } catch (error) {
      console.error('Error loading users from API:', error);
      // Don't fallback to localStorage for admin functions - show error instead
      alert('Không thể tải danh sách người dùng. Vui lòng kiểm tra kết nối đến server.');
      setUsers([]);
      return;
    }
    
    // If API returns empty or invalid data
    setUsers([]);
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      try {
        await usersAPI.delete(userId);
        const updated = users.filter(user => user.id !== userId);
        setUsers(updated);
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.message || 'Đã xảy ra lỗi khi xóa người dùng');
      }
    }
  };

  return (
    <div className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ color: '#2d3748', marginBottom: '0.5rem', fontSize: '2rem' }}>Quản Lý Người Dùng</h2>
            <p style={{ color: '#718096' }}>Tổng cộng: {users.length} người dùng</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
            border: '2px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <UsersIcon size={20} color="#667eea" />
              <span style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Tổng người dùng</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#667eea', margin: 0 }}>
              {stats.total}
            </p>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
            border: '2px solid #fee'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Shield size={20} color="#c33" />
              <span style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Quản trị viên</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c33', margin: 0 }}>
              {stats.admins}
            </p>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
            border: '2px solid #e6fffa'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <User size={20} color="#48bb78" />
              <span style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Người dùng</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#48bb78', margin: 0 }}>
              {stats.regularUsers}
            </p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={18} color="#718096" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} color="#718096" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="user">Người dùng</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 && users.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)'
          }}>
            <p style={{ color: '#718096', fontSize: '1.1rem' }}>
              Không tìm thấy người dùng nào phù hợp với bộ lọc
            </p>
          </div>
        )}

        {filteredUsers.length === 0 && users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Chưa có người dùng nào.</p>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#2d3748', marginBottom: '0.25rem' }}>
                      {user.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#718096', fontSize: '0.9rem' }}>
                      <Mail size={16} />
                      {user.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.5rem', background: user.role === 'admin' ? '#fee' : '#e6fffa', borderRadius: '8px' }}>
                  <Shield size={16} color={user.role === 'admin' ? '#c33' : '#48bb78'} />
                  <span style={{ fontWeight: '600', color: user.role === 'admin' ? '#c33' : '#48bb78' }}>
                    {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                  </span>
                </div>

                {user.role !== 'admin' && (
                  <button
                    onClick={() => deleteUser(user.id)}
                    style={{
                      width: '100%',
                      background: '#f56565',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: '600',
                      transition: 'background 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e53e3e'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f56565'}
                  >
                    <Trash2 size={16} />
                    Xóa người dùng
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;

