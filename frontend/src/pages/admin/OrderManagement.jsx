import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter, ArrowUpDown, X, TrendingUp, ShoppingCart, FileText, Printer, X as XIcon, RefreshCw } from 'lucide-react';
import { ordersAPI } from '../../services/api.js';
import Invoice from '../../components/Invoice.jsx';
import { formatDateTimeVN, parseSqlDatetimeAsUtc } from '../../utils/date.js';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, total, status
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [selectedOrder, setSelectedOrder] = useState(null); // For invoice view
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const refreshIntervalRef = useRef(null);

  const parseOrderTotal = (order) => {
    const rawTotal = order.total_price ?? order.total ?? order.totalPrice ?? order.amount ?? 0;
    const totalValue = Number(rawTotal);
    return Number.isFinite(totalValue) ? totalValue : 0;
  };

  const completedRevenueStatuses = ['completed', 'confirmed'];

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getDailyRevenue = (dateStr) => {
    const day = new Date(dateStr);
    day.setHours(0, 0, 0, 0);
    const total = orders
      .filter(o => {
        const created = parseSqlDatetimeAsUtc(o.createdAt || o.date || o.created_at);
        if (!created) return false;
        created.setHours(0, 0, 0, 0);
        return created.getTime() === day.getTime() && completedRevenueStatuses.includes(o.status);
      })
      .reduce((sum, o) => sum + parseOrderTotal(o), 0);
    return total;
  };

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh mỗi 3 giây để cập nhật đơn hàng mới (chỉ khi không có search/filter active)
    // Giảm thời gian để cập nhật status nhanh hơn sau khi thanh toán
    refreshIntervalRef.current = setInterval(() => {
      if (!searchTerm && statusFilter === 'all') {
        loadOrders(true); // true = silent refresh (không hiển thị loading)
      }
    }, 3000); // Giảm từ 5 giây xuống 3 giây

    // Reload khi tab được focus lại
    const handleFocus = () => {
      if (!searchTerm && statusFilter === 'all') {
        loadOrders(true);
      }
    };
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Reload khi search/filter thay đổi
  useEffect(() => {
    // Debounce search để tránh gọi API quá nhiều khi user đang gõ
    const timer = setTimeout(() => {
      loadOrders(false); // Hiển thị loading khi search/filter
    }, searchTerm ? 500 : 0); // Debounce 500ms cho search, không debounce cho filter
    
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, sortBy, sortOrder]);

  const loadOrders = async (silent = false) => {
    if (!silent) {
      setIsRefreshing(true);
    }
    try {
      // Load orders với search và status filter từ backend
      const statusParam = statusFilter !== 'all' ? statusFilter : null;
      const searchParam = (searchTerm && searchTerm.trim()) ? searchTerm.trim() : null;
      const ordersData = await ordersAPI.getAll(statusParam, searchParam);
      
      // Transform API response to match frontend format
      const transformedOrders = ordersData.map(order => {
        // Safely parse items - could be string or already an object
        let items = [];
        try {
          if (typeof order.items === 'string') {
            items = JSON.parse(order.items);
          } else if (Array.isArray(order.items)) {
            items = order.items;
          }
        } catch (parseError) {
          console.error('Error parsing items for order', order.id, ':', parseError);
          items = [];
        }
        const orderTotal = parseOrderTotal(order);
        return {
          id: order.id,
          userId: order.user_id,
          userName: order.customer_name,
          userEmail: order.customer_email,
          userPhone: order.customer_phone,
          tableNumber: order.table_number,
          numberOfGuests: order.number_of_guests,
          items: items,
          total: orderTotal,
          status: order.status,
          paymentMethod: order.payment_method,
          createdAt: order.created_at
        };
      });
      setOrders(transformedOrders);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error loading orders from API, falling back to localStorage:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('orders');
      if (stored) {
        setOrders(JSON.parse(stored));
      } else {
        setOrders([]);
      }
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  };

  const handleManualRefresh = () => {
    loadOrders(false); // false = hiển thị loading
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // KHÔNG ẩn đơn hàng pending nữa - hiển thị tất cả để admin thấy
    // Chỉ filter theo statusFilter nếu user chọn filter cụ thể

    // Backend đã filter theo status và search, nhưng để chắc chắn filter lại ở client
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = parseSqlDatetimeAsUtc(a.createdAt) - parseSqlDatetimeAsUtc(b.createdAt);
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredOrders(filtered);
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      totalRevenue: orders.reduce((sum, o) => sum + parseOrderTotal(o), 0),
      completedRevenue: orders.filter(o => completedRevenueStatuses.includes(o.status)).reduce((sum, o) => sum + parseOrderTotal(o), 0)
    };
    return stats;
  };

  const stats = getOrderStats();

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      const updated = orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updated);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(error.message || 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return formatDateTimeVN(dateString);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="#48bb78" />;
      default:
        return <Clock size={20} color="#ed8936" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'processing':
        return 'Đang xử lý';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'card':
        return 'Thẻ tín dụng/Ghi nợ';
      case 'cash':
        return 'Tiền mặt';
      default:
        return method || 'Chưa xác định';
    }
  };


  return (
    <>
      {/* Print styles - Invoice component handles its own print styles */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div className="section">
        <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ color: '#2d3748', marginBottom: '0.5rem', fontSize: '2rem' }}>Quản Lý Đơn Hàng</h2>
            <p style={{ color: '#718096' }}>
              Tổng cộng: {orders.length} đơn hàng
              {lastRefreshTime && (
                <span style={{ marginLeft: '1rem', fontSize: '0.85rem' }}>
                  (Cập nhật: {lastRefreshTime.toLocaleTimeString('vi-VN')})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: isRefreshing ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: isRefreshing ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
              opacity: isRefreshing ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }
            }}
          >
            <RefreshCw 
              size={18} 
              style={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                transform: isRefreshing ? 'rotate(360deg)' : 'none'
              }} 
            />
            {isRefreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
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
              <ShoppingCart size={20} color="#667eea" />
              <span style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Tổng đơn</span>
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
            border: '2px solid #fef3c7'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={20} color="#f59e0b" />
              <span style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Doanh thu theo ngày</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none', background: '#667eea', color: 'white', cursor: 'pointer' }}
              >Hôm nay</button>
            </div>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f59e0b', marginTop: '0.75rem' }}>
              {formatPrice(getDailyRevenue(selectedDate))}
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
              <CheckCircle size={20} color="#48bb78" />
              <span style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Hoàn thành</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#48bb78', margin: 0 }}>
              {stats.completed}
            </p>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
            border: '2px solid #f0f4ff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={20} color="#667eea" />
              <span style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Doanh thu tổng</span>
            </div>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#667eea', margin: 0 }}>
              {formatPrice(stats.totalRevenue)}
            </p>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
            border: '2px solid #c6f6d5'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={20} color="#48bb78" />
              <span style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Doanh thu hoàn thành</span>
            </div>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#48bb78', margin: 0 }}>
              {formatPrice(stats.completedRevenue)}
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
              placeholder="Tìm kiếm theo ID, SĐT, số bàn, tổng tiền..."
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

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} color="#718096" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
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
              <option value="date">Sắp xếp theo ngày</option>
              <option value="total">Sắp xếp theo tổng tiền</option>
              <option value="status">Sắp xếp theo trạng thái</option>
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

        {filteredOrders.length === 0 && orders.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)'
          }}>
            <p style={{ color: '#718096', fontSize: '1.1rem' }}>
              {searchTerm 
                ? `Không tìm thấy đơn hàng nào với từ khóa "${searchTerm}"`
                : 'Không tìm thấy đơn hàng nào phù hợp với bộ lọc'}
            </p>
          </div>
        )}

        {filteredOrders.length === 0 && orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Chưa có đơn hàng nào.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>
                      Đơn hàng #{order.id}
                    </h3>
                    {order.tableNumber && (
                      <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                        Bàn: {order.tableNumber} {order.numberOfGuests && `(${order.numberOfGuests} người)`}
                      </p>
                    )}
                    {order.userPhone && (
                      <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                        SĐT: {order.userPhone}
                      </p>
                    )}
                    <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                      Ngày đặt: {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getStatusIcon(order.status)}
                    <span style={{ fontWeight: '600', color: '#4a5568' }}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: '#2d3748' }}>Chi tiết đơn hàng:</h4>
                  {order.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>{item.name} x {item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#667eea', fontSize: '1.2rem' }}>{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {order.status !== 'completed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      style={{
                        background: '#48bb78',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Đánh dấu hoàn thành
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <button
                      onClick={() => {
                        console.log('📄 Opening invoice for order:', order);
                        console.log('   Order ID:', order.id);
                        console.log('   Order items:', order.items);
                        console.log('   Order total:', order.total);
                        // Đảm bảo order data đầy đủ trước khi truyền cho Invoice
                        const invoiceOrder = {
                          ...order,
                          // Đảm bảo có đầy đủ các field cần thiết
                          id: order.id,
                          items: order.items || [],
                          total: order.total || order.total_price || 0,
                          total_price: order.total || order.total_price || 0,
                          totalPrice: order.total || order.total_price || 0,
                          customer_phone: order.userPhone || order.customer_phone,
                          userPhone: order.userPhone || order.customer_phone,
                          table_number: order.tableNumber || order.table_number,
                          tableNumber: order.tableNumber || order.table_number,
                          number_of_guests: order.numberOfGuests || order.number_of_guests,
                          numberOfGuests: order.numberOfGuests || order.number_of_guests,
                          payment_method: order.paymentMethod || order.payment_method,
                          paymentMethod: order.paymentMethod || order.payment_method,
                          created_at: order.createdAt || order.created_at,
                          createdAt: order.createdAt || order.created_at,
                          date: order.createdAt || order.created_at || order.date,
                          status: order.status
                        };
                        console.log('📄 Invoice order data:', invoiceOrder);
                        setSelectedOrder(invoiceOrder);
                      }}
                      style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FileText size={16} />
                      Xem hóa đơn
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem',
          overflow: 'auto'
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '3rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setSelectedOrder(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.3s',
                zIndex: 10
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <XIcon size={24} color="#718096" />
            </button>

            {/* Invoice Component */}
            <Invoice 
              order={selectedOrder} 
              onClose={() => setSelectedOrder(null)}
              showActions={true}
            />
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default OrderManagement;

