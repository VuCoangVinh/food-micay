import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Home, ArrowLeft } from 'lucide-react';
import { ordersAPI } from '../services/api.js';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const orderId = searchParams.get('orderId');
  const reason = searchParams.get('reason');

  useEffect(() => {
    const loadOrder = async () => {
      if (orderId) {
        try {
          const order = await ordersAPI.getById(orderId);
          setOrderData(order);
        } catch (error) {
          console.error('Error loading order:', error);
        }
      }
      setLoading(false);
    };

    loadOrder();
  }, [orderId]);

  const getReasonMessage = (reason) => {
    const reasons = {
      'invalid_signature': 'Chữ ký không hợp lệ',
      'order_not_found': 'Không tìm thấy đơn hàng',
      'server_error': 'Lỗi server',
      '07': 'Trừ tiền thành công nhưng thẻ bị nghi ngờ (liên quan đến lừa đảo, giao dịch bất thường)',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
      '10': 'Xác thực giao dịch không thành công do: Nhập sai quá 3 lần mật khẩu, thẻ bị khóa, thẻ hết hạn, thẻ chưa kích hoạt',
      '11': 'Đã hết hạn chờ thanh toán. Vui lòng thử lại',
      '12': 'Thẻ/Tài khoản bị khóa',
      '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP)',
      '51': 'Tài khoản không đủ số dư để thực hiện giao dịch',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định'
    };
    return reasons[reason] || 'Thanh toán thất bại. Vui lòng thử lại.';
  };

  if (loading) {
    return (
      <div className="section">
        <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '3rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          {/* Error Icon */}
          <div style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 10px 30px rgba(245, 101, 101, 0.4)'
          }}>
            <XCircle size={50} color="white" />
          </div>

          {/* Title */}
          <h1 style={{
            color: '#e53e3e',
            marginBottom: '1rem',
            fontSize: '2.5rem'
          }}>
            Thanh Toán Thất Bại
          </h1>

          <p style={{ color: '#718096', marginBottom: '2rem', fontSize: '1.1rem' }}>
            {getReasonMessage(reason)}
          </p>

          {/* Order Info */}
          {orderData && (
            <div style={{
              background: '#fff5f5',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              textAlign: 'left',
              border: '1px solid #feb2b2'
            }}>
              <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
                Thông Tin Đơn Hàng
              </h3>
              
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#718096' }}>Mã đơn hàng:</span>
                  <span style={{ fontWeight: '600', color: '#2d3748' }}>#{orderData.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#718096' }}>Trạng thái:</span>
                  <span style={{ fontWeight: '600', color: '#e53e3e' }}>Chưa thanh toán</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/payment', { state: { order: orderData } })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              <ArrowLeft size={20} />
              Thử Lại Thanh Toán
            </button>
            
            <button
              onClick={() => navigate('/home')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 2rem',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f4ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <Home size={20} />
              Về Trang Chủ
            </button>
          </div>

          {/* Help */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#fff5f5',
            borderRadius: '8px',
            border: '1px solid #feb2b2'
          }}>
            <p style={{ color: '#718096', fontSize: '0.9rem', margin: 0 }}>
              💡 <strong>Gợi ý:</strong> Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ với chúng tôi hoặc thử phương thức thanh toán khác.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;














