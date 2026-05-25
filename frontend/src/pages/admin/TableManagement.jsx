import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, QrCode, Download, Copy, Check } from 'lucide-react';
import { tablesAPI } from '../../services/api.js';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    number: '',
    capacity: '4',
    status: 'available', // available, occupied, reserved
    qrCode: ''
  });
  const [copiedTableId, setCopiedTableId] = useState(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const tablesData = await tablesAPI.getAll();
      if (tablesData && Array.isArray(tablesData)) {
        // Transform API response to match frontend format
        const transformedTables = tablesData.map(table => ({
          id: table.id,
          name: table.name,
          number: table.name, // For compatibility
          capacity: table.capacity,
          status: table.status,
          qrCode: table.qrCodeUrl || generateQRCode(table.id),
          qrCodeUrl: table.qrCodeUrl || generateQRCode(table.id)
        }));
        setTables(transformedTables);
      } else {
        setTables([]);
      }
    } catch (error) {
      console.error('Error loading tables from API:', error);
      alert('Không thể tải danh sách bàn. Vui lòng kiểm tra kết nối đến server.');
      setTables([]);
    }
  };

  const generateQRCode = (tableId) => {
    // Prefer qrCodeUrl from backend API (most reliable)
    // Fallback to current origin if not available
    const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    return `${baseUrl}/home?table=${tableId}`;
  };

  const generateQRImage = (tableId) => {
    // Use a QR code API or library
    const qrUrl = generateQRCode(tableId);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
  };

  const saveTables = (updatedTables) => {
    localStorage.setItem('tables', JSON.stringify(updatedTables));
    setTables(updatedTables);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.number.trim()) {
      alert('Vui lòng nhập số bàn');
      return;
    }

    try {
      const tableData = {
        name: formData.number.trim(),
        capacity: parseInt(formData.capacity) || 4,
        status: formData.status || 'available'
      };

      if (editingTable) {
        // Update existing table
        const updated = await tablesAPI.update(editingTable.id, tableData);
        const updatedTables = tables.map(table =>
          table.id === editingTable.id ? {
            ...table,
            name: updated.name,
            number: updated.name,
            capacity: updated.capacity,
            status: updated.status,
            qrCodeUrl: updated.qrCodeUrl
          } : table
        );
        setTables(updatedTables);
      } else {
        // Create new table
        const newTable = await tablesAPI.create(tableData);
        const tableToAdd = {
          id: newTable.id,
          name: newTable.name,
          number: newTable.name,
          capacity: newTable.capacity,
          status: newTable.status,
          qrCode: newTable.qrCodeUrl || generateQRCode(newTable.id),
          qrCodeUrl: newTable.qrCodeUrl
        };
        setTables([...tables, tableToAdd]);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving table:', error);
      alert(error.message || 'Đã xảy ra lỗi khi lưu bàn');
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      capacity: table.capacity.toString(),
      status: table.status,
      qrCode: table.qrCode
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa bàn này?')) {
      try {
        await tablesAPI.delete(id);
        setTables(tables.filter(table => table.id !== id));
      } catch (error) {
        console.error('Error deleting table:', error);
        alert(error.message || 'Đã xảy ra lỗi khi xóa bàn');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      number: '',
      capacity: '4',
      status: 'available',
      qrCode: ''
    });
    setEditingTable(null);
    setShowForm(false);
  };

  const copyQRUrl = (table) => {
    const urlToCopy = table.qrCodeUrl || table.qrCode || generateQRCode(table.id);
    navigator.clipboard.writeText(urlToCopy);
    setCopiedTableId(table.id);
    setTimeout(() => setCopiedTableId(null), 2000);
  };

  const downloadQR = (table) => {
    const qrImageUrl = generateQRImage(table.id);
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `QR-Ban-${table.number.replace(/\s/g, '-')}.png`;
    link.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return { bg: '#e6fffa', color: '#48bb78', text: 'Trống' };
      case 'occupied':
        return { bg: '#fff4e6', color: '#ed8936', text: 'Đang dùng' };
      case 'reserved':
        return { bg: '#e6f3ff', color: '#667eea', text: 'Đã đặt' };
      default:
        return { bg: '#f7fafc', color: '#718096', text: status };
    }
  };

  return (
    <div className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ color: '#2d3748', marginBottom: '0.5rem', fontSize: '2rem' }}>Quản Lý Bàn</h2>
            <p style={{ color: '#718096' }}>Tổng cộng: {tables.length} bàn</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={20} />
            Thêm Bàn
          </button>
        </div>

        {showForm && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>
              {editingTable ? 'Sửa Thông Tin Bàn' : 'Thêm Bàn Mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Số bàn *</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    required
                    placeholder="Ví dụ: Bàn 1"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Sức chứa *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    min="1"
                    max="20"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px' }}
                  >
                    <option value="available">Trống</option>
                    <option value="occupied">Đang dùng</option>
                    <option value="reserved">Đã đặt</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn">
                  {editingTable ? 'Cập Nhật' : 'Thêm Bàn'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
          {tables.map((table) => {
            const statusStyle = getStatusColor(table.status);
            return (
              <div
                key={table.id}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ color: '#2d3748', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
                      {table.number}
                    </h3>
                    <p style={{ color: '#718096', marginBottom: '0.5rem' }}>
                      Sức chứa: {table.capacity} người
                    </p>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {statusStyle.text}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(table)}
                      style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      style={{
                        background: '#f56565',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div style={{
                  background: '#f7fafc',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ color: '#2d3748', marginBottom: '1rem', fontSize: '1rem' }}>
                    Mã QR Code
                  </h4>
                  <img
                    src={generateQRImage(table.id)}
                    alt={`QR Code ${table.number}`}
                    style={{
                      width: '150px',
                      height: '150px',
                      margin: '0 auto 1rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      background: 'white'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => copyQRUrl(table)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: copiedTableId === table.id ? '#48bb78' : '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      {copiedTableId === table.id ? <Check size={16} /> : <Copy size={16} />}
                      {copiedTableId === table.id ? 'Đã copy' : 'Copy URL'}
                    </button>
                    <button
                      onClick={() => downloadQR(table)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: '#ed8936',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      <Download size={16} />
                      Tải QR
                    </button>
                  </div>
                  <p style={{ color: '#718096', fontSize: '0.75rem', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                    {table.qrCodeUrl || table.qrCode || generateQRCode(table.id)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {tables.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Chưa có bàn nào. Hãy thêm bàn đầu tiên!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableManagement;



