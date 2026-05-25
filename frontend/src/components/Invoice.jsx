import React from 'react';
import { Printer } from 'lucide-react';
import { formatDateTimeVN } from '../utils/date.js';

const Invoice = ({ order, onClose, showActions = true }) => {
  // Validate order
  if (!order) {
    return (
      <div id="invoice-content-wrapper" style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
        <div id="invoice-content">
          <p>Không có dữ liệu đơn hàng</p>
        </div>
      </div>
    );
  }
  
  // Debug: Log order data
  console.log('📄 Invoice Component - Order Data:', order);
  console.log('   Order ID:', order?.id);
  console.log('   Order items:', order?.items);
  console.log('   Order total:', order?.total || order?.total_price || order?.totalPrice);
  console.log('   Order status:', order?.status);

  const formatPrice = (price) => {
    if (!price && price !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return formatDateTimeVN(dateString);
    } catch (e) {
      return String(dateString);
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'card':
        return 'Thẻ tín dụng/Ghi nợ';
      case 'cash':
        return 'Tiền mặt';
      case 'momo':
        return 'MoMo';
      case 'zalo':
        return 'ZaloPay';
      default:
        return method || 'Chưa xác định';
    }
  };

  // Parse items - có thể là string hoặc array
  let items = [];
  try {
    if (typeof order.items === 'string') {
      items = JSON.parse(order.items);
    } else if (Array.isArray(order.items)) {
      items = order.items;
    } else if (!order.items) {
      console.warn('⚠️ Order items is null or undefined');
      items = [];
    }
  } catch (e) {
    console.error('❌ Error parsing items:', e);
    console.error('   Items value:', order.items);
    items = [];
  }
  
  console.log('📄 Parsed items:', items);
  console.log('   Items count:', items.length);

  const handlePrint = () => {
    console.log('🖨️ Starting print process...');
    console.log('Order data:', order);
    console.log('Items:', items);
    
    // Get invoice content
    const invoiceContent = document.getElementById('invoice-content');
    
    if (!invoiceContent) {
      console.error('❌ Invoice content not found!');
      alert('Không tìm thấy nội dung hóa đơn để in');
      return;
    }
    
    console.log('✅ Invoice content found');
    
    // Create a clone of invoice content and append to body for printing
    // This ensures it's not affected by modal styles
    const printContainer = document.createElement('div');
    printContainer.id = 'invoice-print-container';
    printContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 99999;
      overflow: auto;
      padding: 2cm;
      display: block;
      visibility: visible;
    `;
    
    // Clone the invoice content
    const clonedContent = invoiceContent.cloneNode(true);
    clonedContent.id = 'invoice-content-print';
    clonedContent.style.cssText = `
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
      display: block;
      visibility: visible;
      position: relative;
      background: white;
      color: #000;
    `;
    
    // Force all styles for print
    const allElements = clonedContent.querySelectorAll('*');
    allElements.forEach(el => {
      el.style.setProperty('visibility', 'visible', 'important');
      el.style.setProperty('color', '#000', 'important');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
    });
    
    // Force table elements
    const tables = clonedContent.querySelectorAll('table');
    tables.forEach(table => {
      table.style.setProperty('display', 'table', 'important');
      table.style.setProperty('visibility', 'visible', 'important');
      table.style.setProperty('width', '100%', 'important');
      table.style.setProperty('border-collapse', 'collapse', 'important');
    });
    
    const tableCells = clonedContent.querySelectorAll('td, th');
    tableCells.forEach(cell => {
      cell.style.setProperty('display', 'table-cell', 'important');
      cell.style.setProperty('visibility', 'visible', 'important');
      cell.style.setProperty('color', '#000', 'important');
      cell.style.setProperty('border', '1px solid #000', 'important');
      cell.style.setProperty('padding', '8pt', 'important');
    });
    
    // Force headers
    const headers = clonedContent.querySelectorAll('h1, h3');
    headers.forEach(header => {
      header.style.setProperty('display', 'block', 'important');
      header.style.setProperty('visibility', 'visible', 'important');
      header.style.setProperty('color', '#000', 'important');
    });
    
    // Force paragraphs
    const paragraphs = clonedContent.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.style.setProperty('display', 'block', 'important');
      p.style.setProperty('visibility', 'visible', 'important');
      p.style.setProperty('color', '#000', 'important');
    });
    
    // Force divs
    const divs = clonedContent.querySelectorAll('div');
    divs.forEach(div => {
      div.style.setProperty('display', 'block', 'important');
      div.style.setProperty('visibility', 'visible', 'important');
    });
    
    // Force spans
    const spans = clonedContent.querySelectorAll('span');
    spans.forEach(span => {
      span.style.setProperty('display', 'inline', 'important');
      span.style.setProperty('visibility', 'visible', 'important');
      span.style.setProperty('color', '#000', 'important');
    });
    
    printContainer.appendChild(clonedContent);
    document.body.appendChild(printContainer);
    
    console.log('✅ Print container created and appended to body');
    
    // Wait a bit for rendering, then print
    setTimeout(() => {
      window.print();
      
      // Clean up after printing
      setTimeout(() => {
        if (printContainer && printContainer.parentNode) {
          printContainer.parentNode.removeChild(printContainer);
          console.log('✅ Print container removed');
        }
      }, 500);
    }, 300);
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Reset toàn bộ */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            overflow: visible !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
            color: #000 !important;
          }
          
          /* Ẩn tất cả ngoại trừ print container */
          body > *:not(#invoice-print-container) {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          
          /* Print container */
          #invoice-print-container {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            page-break-after: avoid !important;
            overflow: visible !important;
            top: 0 !important;
            left: 0 !important;
          }
          
          /* Invoice content in print container */
          #invoice-content-print,
          #invoice-content {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 1.5cm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            color: #000 !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
            font-family: Arial, sans-serif !important;
            overflow: visible !important;
          }
          
          /* Tất cả elements trong invoice */
          #invoice-content-print *,
          #invoice-content * {
            visibility: visible !important;
            color: #000 !important;
            background-color: transparent !important;
          }
          
          /* Headers */
          #invoice-content-print h1,
          #invoice-content h1 {
            display: block !important;
            visibility: visible !important;
            color: #000 !important;
            font-size: 24pt !important;
            font-weight: bold !important;
            margin: 0 0 10pt 0 !important;
            padding: 0 !important;
            page-break-after: avoid !important;
          }
          
          #invoice-content-print h3,
          #invoice-content h3 {
            display: block !important;
            visibility: visible !important;
            color: #000 !important;
            font-size: 14pt !important;
            font-weight: bold !important;
            margin: 15pt 0 10pt 0 !important;
            padding: 0 !important;
            page-break-after: avoid !important;
          }
          
          /* Paragraphs */
          #invoice-content-print p,
          #invoice-content p {
            display: block !important;
            visibility: visible !important;
            color: #000 !important;
            margin: 5pt 0 !important;
            padding: 0 !important;
            font-size: 12pt !important;
          }
          
          /* Divs */
          #invoice-content-print > div,
          #invoice-content > div {
            display: block !important;
            visibility: visible !important;
            margin: 10pt 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
          }
          
          /* Spans */
          #invoice-content-print span,
          #invoice-content span {
            display: inline !important;
            visibility: visible !important;
            color: #000 !important;
          }
          
          /* Tables - QUAN TRỌNG */
          #invoice-content-print table,
          #invoice-content table {
            display: table !important;
            visibility: visible !important;
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 15pt 0 !important;
            page-break-inside: avoid !important;
            border: 1px solid #000 !important;
          }
          
          #invoice-content-print thead,
          #invoice-content thead {
            display: table-header-group !important;
            visibility: visible !important;
            background: #f0f0f0 !important;
          }
          
          #invoice-content-print tbody,
          #invoice-content tbody {
            display: table-row-group !important;
            visibility: visible !important;
          }
          
          #invoice-content-print tr,
          #invoice-content tr {
            display: table-row !important;
            visibility: visible !important;
            page-break-inside: avoid !important;
            border: 1px solid #000 !important;
          }
          
          #invoice-content-print td,
          #invoice-content-print th,
          #invoice-content td,
          #invoice-content th {
            display: table-cell !important;
            visibility: visible !important;
            border: 1px solid #000 !important;
            padding: 8pt !important;
            color: #000 !important;
            text-align: left !important;
            font-size: 11pt !important;
            background: white !important;
          }
          
          #invoice-content-print th,
          #invoice-content th {
            font-weight: bold !important;
            background: #f0f0f0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Ẩn buttons */
          button, .no-print, .no-print *,
          [class*="no-print"], [id*="no-print"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          
          /* Page settings */
          @page {
            margin: 0.5cm;
            size: A4 portrait;
          }
        }
      `}</style>

      <div id="invoice-content-wrapper" style={{ 
        display: 'block', 
        visibility: 'visible',
        position: 'relative',
        width: '100%',
        background: 'white'
      }}>
        <div id="invoice-content" style={{ 
          fontFamily: 'Arial, sans-serif', 
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '2rem',
          display: 'block', 
          visibility: 'visible',
          position: 'relative',
          background: 'white',
          color: '#000'
        }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
          <h1 style={{ color: '#2d3748', marginBottom: '0.25rem', fontSize: '1.8rem', fontWeight: 'bold' }}>HÓA ĐƠN</h1>
          <p style={{ color: '#718096', fontSize: '1rem', fontWeight: '600' }}>FoodOrder Restaurant</p>
          <p style={{ color: '#718096', fontSize: '0.85rem', fontWeight: '600' }}>Mã đơn hàng: #{order.id || 'N/A'}</p>
        </div>

        {/* Order Info */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            color: '#2d3748', 
            marginBottom: '0.75rem', 
            fontSize: '1.1rem', 
            borderBottom: '1px solid #e2e8f0', 
            paddingBottom: '0.5rem',
            fontWeight: '600'
          }}>
            Thông Tin Đơn Hàng
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              {(order.customer_phone || order.userPhone) && (
                <p style={{ margin: '0.5rem 0', color: '#4a5568' }}>
                  <strong>Số điện thoại:</strong> {order.customer_phone || order.userPhone}
                </p>
              )}
            </div>
            <div>
              {(order.table_number || order.tableNumber) && (
                <p style={{ margin: '0.5rem 0', color: '#4a5568' }}>
                  <strong>Bàn:</strong> {order.table_number || order.tableNumber}
                  {(order.number_of_guests || order.numberOfGuests) && ` (${order.number_of_guests || order.numberOfGuests} người)`}
                </p>
              )}
              <p style={{ margin: '0.5rem 0', color: '#4a5568' }}>
                <strong>Ngày đặt:</strong> {formatDate(order.created_at || order.createdAt || order.date)}
              </p>
              <p style={{ margin: '0.5rem 0', color: '#4a5568' }}>
                <strong>Phương thức thanh toán:</strong> {getPaymentMethodText(order.payment_method || order.paymentMethod || order.payment_method)}
              </p>
              {order.status && (
                <p style={{ margin: '0.5rem 0', color: '#4a5568' }}>
                  <strong>Trạng thái:</strong> 
                  <span style={{ 
                    color: order.status === 'completed' ? '#48bb78' : 
                           order.status === 'processing' ? '#ed8936' : '#718096',
                    fontWeight: '600',
                    marginLeft: '0.5rem'
                  }}>
                    {order.status === 'completed' ? 'Hoàn thành' :
                     order.status === 'processing' ? 'Đang xử lý' :
                     order.status === 'pending' ? 'Đang chờ' : order.status}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            color: '#2d3748', 
            marginBottom: '0.75rem', 
            fontSize: '1.2rem', 
            borderBottom: '1px solid #e2e8f0', 
            paddingBottom: '0.5rem',
            fontWeight: '600'
          }}>
            Chi Tiết Đơn Hàng
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#2d3748', fontWeight: '600', border: '1px solid #e2e8f0' }}>Món ăn</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#2d3748', fontWeight: '600', border: '1px solid #e2e8f0', width: '80px' }}>SL</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#2d3748', fontWeight: '600', border: '1px solid #e2e8f0', width: '120px' }}>Đơn giá</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#2d3748', fontWeight: '600', border: '1px solid #e2e8f0', width: '120px' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item, index) => {
                  const itemName = item.name || item.menu_name || item.menuName || 'N/A';
                  const itemQuantity = item.quantity || item.amount || 1;
                  const itemPrice = item.price || item.menu_price || item.menuPrice || 0;
                  const itemTotal = itemPrice * itemQuantity;
                  
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem', color: '#4a5568', border: '1px solid #e2e8f0' }}>{itemName}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#4a5568', border: '1px solid #e2e8f0' }}>{itemQuantity}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#4a5568', border: '1px solid #e2e8f0' }}>{formatPrice(itemPrice)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#4a5568', fontWeight: '600', border: '1px solid #e2e8f0' }}>
                        {formatPrice(itemTotal)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '0.75rem', textAlign: 'center', color: '#718096', border: '1px solid #e2e8f0' }}>
                    {order.items ? 'Không có món ăn nào' : 'Dữ liệu đơn hàng không hợp lệ'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div style={{
          background: '#f7fafc',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '2px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2d3748' }}>Tổng cộng:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#667eea' }}>
              {formatPrice(order.total_price || order.total || order.totalPrice || 0)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '2px solid #e2e8f0', color: '#718096', fontSize: '0.85rem' }}>
          <p style={{ margin: '0.25rem 0' }}>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
          <p style={{ margin: '0.25rem 0' }}>Hóa đơn được tạo tự động từ hệ thống FoodOrder</p>
        </div>
      </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="no-print" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button
            onClick={handlePrint}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5568d3';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}
          >
            <Printer size={20} />
            In hóa đơn
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: '#e2e8f0',
                color: '#4a5568',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#cbd5e0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#e2e8f0';
              }}
            >
              Đóng
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default Invoice;








