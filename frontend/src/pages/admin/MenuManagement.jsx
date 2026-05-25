import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, ArrowUpDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { menuAPI, uploadAPI } from '../../services/api.js';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // name, price, category
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main',
    image: ''
  });
  const [imagePreview, setImagePreview] = useState(null);

  const categories = [
    { id: 'main', name: 'Món Chính' },
    { id: 'dessert', name: 'Tráng Miệng' },
    { id: 'drink', name: 'Đồ Uống' }
  ];

  useEffect(() => {
    // Load menu items from API only
    loadMenuItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
    setCurrentPage(1); // Reset về trang 1 khi filter/sort thay đổi
  }, [menuItems, searchTerm, selectedCategory, sortBy, sortOrder]);

  const filterAndSortItems = () => {
    let filtered = [...menuItems];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredItems(filtered);
  };

  const loadMenuItems = async () => {
    try {
      // Load from API only (no localStorage fallback for admin)
      const items = await menuAPI.getAll();
      if (items && Array.isArray(items)) {
        setMenuItems(items);
        setError(''); // Clear any previous errors
        return;
      } else {
        setMenuItems([]);
        setError('Không có dữ liệu món ăn');
      }
    } catch (error) {
      console.error('Error loading menu from API:', error);
      const errorMessage = error.message || 'Không thể tải danh sách món ăn';
      setError(`Lỗi: ${errorMessage}. Vui lòng kiểm tra kết nối đến server và đảm bảo đã đăng nhập với tài khoản admin.`);
      setMenuItems([]);
    }
  };

  const validatePrice = (price) => {
    const numPrice = Number(price);
    return !isNaN(numPrice) && numPrice > 0;
  };

  const validateImageURL = (url) => {
    if (!url.trim()) return true; // Optional field
    // Accept both URLs, local paths, and base64 images
    if (url.startsWith('/images/')) return true;
    if (url.startsWith('data:image/')) return true; // Base64 image
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh (jpg, png, gif, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({ ...formData, image: base64String });
        setImagePreview(base64String);
        setError('');
      };
      reader.onerror = () => {
        setError('Lỗi khi đọc file ảnh. Vui lòng thử lại.');
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate name
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên món ăn');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Tên món ăn phải có ít nhất 2 ký tự');
      return;
    }

    // Validate description
    if (!formData.description.trim()) {
      setError('Vui lòng nhập mô tả món ăn');
      return;
    }

    if (formData.description.trim().length < 10) {
      setError('Mô tả món ăn phải có ít nhất 10 ký tự');
      return;
    }

    // Validate price
    if (!validatePrice(formData.price)) {
      setError('Giá không hợp lệ (phải là số dương)');
      return;
    }

    const priceValue = Number(formData.price);
    if (priceValue < 1000) {
      setError('Giá phải tối thiểu 1,000 VND');
      return;
    }

    if (priceValue > 10000000) {
      setError('Giá không được vượt quá 10,000,000 VND');
      return;
    }

    // Validate image URL if provided
    if (formData.image && !validateImageURL(formData.image)) {
      setError('URL hình ảnh không hợp lệ');
      return;
    }

    const saveItem = async () => {
      try {
        setError('');
        setLoading(true);
        
        // Upload image if it's a file (base64)
        let imageUrl = formData.image;
        if (formData.image && formData.image.startsWith('data:image/')) {
          // Convert base64 to blob and upload
          try {
            const response = await fetch(formData.image);
            const blob = await response.blob();
            const file = new File([blob], 'image.jpg', { type: blob.type });
            const uploadResult = await uploadAPI.uploadImage(file);
            imageUrl = uploadResult.imageUrl;
          } catch (uploadError) {
            console.error('Upload error, using base64:', uploadError);
            // Keep base64 if upload fails
          }
        }

        const itemData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: Number(formData.price),
          category: formData.category,
          image: imageUrl || null
        };

        if (editingItem) {
          // Update existing item
          console.log('Updating menu item:', editingItem.id, itemData);
          const updated = await menuAPI.update(editingItem.id, itemData);
          console.log('Update result:', updated);
          // Reload menu items to ensure consistency
          await loadMenuItems();
        } else {
          // Add new item
          console.log('Creating new menu item:', itemData);
          const newItem = await menuAPI.create(itemData);
          console.log('Create result:', newItem);
          // Reload menu items to ensure consistency
          await loadMenuItems();
        }
        
        setError('');
        resetForm();
        setLoading(false);
      } catch (err) {
        console.error('Error saving menu item:', err);
        const errorMessage = err.message || err.error || 'Đã xảy ra lỗi khi lưu món ăn. Vui lòng thử lại.';
        setError(errorMessage);
        setLoading(false);
      }
    };

    saveItem();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: item.image
    });
    // Set preview if image is base64
    if (item.image && item.image.startsWith('data:image/')) {
      setImagePreview(item.image);
    } else {
      setImagePreview(null);
    }
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa món ăn này?')) {
      try {
        setLoading(true);
        setError('');
        console.log('Deleting menu item:', id);
        await menuAPI.delete(id);
        console.log('Delete successful');
        // Reload menu items to ensure consistency
        await loadMenuItems();
        setLoading(false);
      } catch (error) {
        console.error('Error deleting menu item:', error);
        const errorMessage = error.message || error.error || 'Đã xảy ra lỗi khi xóa món ăn';
        setError(errorMessage);
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'main',
      image: ''
    });
    setImagePreview(null);
    setEditingItem(null);
    setShowForm(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ color: '#2d3748', marginBottom: '0.5rem', fontSize: '2rem' }}>Quản Lý Thực Đơn</h2>
            <p style={{ color: '#718096' }}>Tổng cộng: {menuItems.length} món ăn</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={20} />
            Thêm Món Ăn
          </button>
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
              placeholder="Tìm kiếm món ăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} color="#718096" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} color="#718096" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={20} color="#718096" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                background: 'white',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              <option value="name">Sắp xếp theo tên</option>
              <option value="price">Sắp xếp theo giá</option>
              <option value="category">Sắp xếp theo danh mục</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                background: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                color: '#667eea'
              }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
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
              {editingItem ? 'Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
            </h3>
            
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Tên món</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Giá (VND)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px' }}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows="3"
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Hình ảnh sản phẩm
                </label>
                
                {/* Upload từ máy tính */}
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="image-upload"
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    📷 Tải ảnh từ máy tính
                  </label>
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <p style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.5rem' }}>
                    Chọn file ảnh (JPG, PNG, GIF - tối đa 5MB)
                  </p>
                </div>

                {/* Preview ảnh */}
                {(imagePreview || (formData.image && formData.image.startsWith('data:image/'))) && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    border: '2px dashed #667eea',
                    borderRadius: '8px',
                    background: '#f7fafc',
                    textAlign: 'center'
                  }}>
                    <p style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#2d3748' }}>Xem trước ảnh:</p>
                    <img
                      src={imagePreview || formData.image}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        objectFit: 'contain',
                        margin: '0 auto',
                        display: 'block'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image: '' });
                        setImagePreview(null);
                      }}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: '#f56565',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Xóa ảnh
                    </button>
                  </div>
                )}

                {/* Hiển thị ảnh hiện tại nếu đang edit và không có preview */}
                {editingItem && !imagePreview && formData.image && !formData.image.startsWith('data:image/') && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#f7fafc',
                    textAlign: 'center'
                  }}>
                    <p style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#2d3748' }}>Ảnh hiện tại:</p>
                    <img
                      src={formData.image}
                      alt="Current"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        objectFit: 'contain',
                        margin: '0 auto',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn">
                  {editingItem ? 'Cập Nhật' : 'Thêm Món'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredItems.length === 0 && menuItems.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)'
          }}>
            <p style={{ color: '#718096', fontSize: '1.1rem' }}>
              Không tìm thấy món ăn nào phù hợp với bộ lọc
            </p>
          </div>
        )}

        {/* Phân trang */}
        {(() => {
          const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedItems = filteredItems.slice(startIndex, endIndex);

          return (
            <>
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
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(item)}
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
                      onClick={() => handleDelete(item.id)}
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
              </div>
            </div>
          ))}
        </div>

              {/* Pagination Controls */}
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
            </>
          );
        })()}

        {menuItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Chưa có món ăn nào. Hãy thêm món ăn đầu tiên!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;

