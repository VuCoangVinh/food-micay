# 🍜 FoodOrder - Hệ Thống Đặt Món Online

Hệ thống quản lý đặt món cho nhà hàng với giao diện người dùng và quản trị viên, hỗ trợ thanh toán bằng thẻ nội bộ và tiền mặt.

> 📖 **Hướng dẫn Deploy miễn phí**: 
> - 🚀 **[Hướng dẫn chi tiết từng bước](./DEPLOY_STEP_BY_STEP_DETAILED.md)** ⭐ **KHUYẾN NGHỊ**
> - ⚡ [Deploy nhanh trên Render](./DEPLOY_QUICK.md) (5 bước)
> - 📚 [Hướng dẫn chi tiết](./DEPLOY.md) (Render, Vercel, Railway)
> - 📦 [Deploy Monorepo](./MONOREPO_DEPLOY.md) (Backend + Frontend cùng repo)
> - 🔐 [Cách điền Environment Variables](./ENV_VARIABLES_GUIDE.md) (Chi tiết từng biến)
> - ⚡ [Tham khảo nhanh Env Variables](./ENV_QUICK_REFERENCE.md) (Bảng tóm tắt)
> - ✅ [Checklist deploy đầy đủ](./FINAL_DEPLOY_CHECKLIST.md) (Đảm bảo 100% hoạt động)

## ✨ Tính Năng

- 👤 **Quản lý người dùng**: Đăng ký, đăng nhập, phân quyền (User/Admin)
- 🍽️ **Quản lý menu**: Thêm, sửa, xóa món ăn theo danh mục
- 🪑 **Quản lý bàn**: Tạo bàn, QR code cho từng bàn
- 📦 **Đặt hàng**: Thêm vào giỏ, đặt món, theo dõi đơn hàng
- 💳 **Thanh toán**: Hỗ trợ thẻ tín dụng/ghi nợ và tiền mặt
- 📧 **Email**: Gửi email xác nhận đơn hàng
- 📊 **Dashboard**: Thống kê đơn hàng, doanh thu cho admin

## 🛠️ Công Nghệ

### Backend
- Node.js + Express
- SQLite (Database)
- JWT (Authentication)
- Thanh toán thẻ nội bộ / tiền mặt
- Nodemailer (Email)

### Frontend
- React 19
- Vite
- React Router

## 📋 Yêu Cầu Hệ Thống

- Node.js >= 18.x
- npm hoặc yarn
- Git

## 🚀 Cài Đặt

### 1. Clone dự án
```bash
git clone <repository-url>
cd Order_Frontend
```

### 2. Cài đặt Backend
```bash
cd backend
npm install
```

### 3. Cài đặt Frontend
```bash
cd ../frontend
npm install
```

## ⚙️ Cấu Hình

### Backend (.env)
Tạo file `backend/.env`:
```env
# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key-here

# Email (tùy chọn)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend (.env)
Tạo file `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

## ▶️ Chạy Ứng Dụng

### Cách 1: Chạy tất cả (Khuyến nghị)
```bash
chmod +x start-all.sh
./start-all.sh
```

### Cách 2: Chạy riêng lẻ

**Backend:**
```bash
cd backend
npm run dev
```
Backend chạy tại: http://localhost:3001

**Frontend:**
```bash
cd frontend
npm run dev
```
Frontend chạy tại: http://localhost:5173

## 🔐 Tài Khoản Mặc Định

Sau khi khởi động lần đầu, hệ thống tự động tạo:

**Admin:**
- Email: `admin@foodorder.com`
- Password: `admin123`

**Database:**
- Tự động tạo 5 bàn mặc định (Bàn 1-5)
- Tự động tạo 15 món ăn mẫu

## 📁 Cấu Trúc Dự Án

```
Order_Frontend/
├── backend/
│   ├── src/
│   │   ├── config/        # Cấu hình (database, email)
│   │   ├── controllers/   # Logic xử lý
│   │   ├── middleware/    # Middleware (auth)
│   │   ├── routes/        # API routes
│   │   └── server.js      # Entry point
│   ├── uploads/           # Ảnh upload
│   └── database.sqlite    # Database (tự động tạo)
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # Context API
│   │   ├── pages/         # Trang
│   │   ├── services/      # API services
│   │   └── App.jsx
│   └── public/            # Static files
│
└── start-all.sh           # Script khởi động
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Thông tin user hiện tại

### Menu
- `GET /api/menu` - Lấy danh sách món
- `POST /api/menu` - Thêm món (Admin)
- `PUT /api/menu/:id` - Sửa món (Admin)
- `DELETE /api/menu/:id` - Xóa món (Admin)

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng
- `PUT /api/orders/:id` - Cập nhật trạng thái đơn

### Tables
- `GET /api/tables` - Lấy danh sách bàn
- `POST /api/tables` - Tạo bàn (Admin)
- `PUT /api/tables/:id` - Cập nhật bàn

### Payment
- `POST /api/payment/card` - Thanh toán bằng thẻ (mock)
- `POST /api/payment/ewallet` - Thanh toán e-wallet (MoMo, ZaloPay mock)

## 🧪 Kiểm Tra Hệ Thống

```bash
chmod +x check-system.sh
./check-system.sh
```

## 📝 Scripts Hữu Ích

- `start-all.sh` - Khởi động cả backend và frontend
- `check-system.sh` - Kiểm tra cấu hình hệ thống
- `test-api.sh` - Test API endpoints

## 🐛 Xử Lý Lỗi

### Port đã được sử dụng
```bash
# Backend (port 3001)
cd backend
npm run kill

# Hoặc
lsof -ti:3001 | xargs kill -9
```

### Database lỗi
Xóa file `backend/database.sqlite` và khởi động lại để tạo database mới.

## 📄 License

ISC

## 👥 Tác Giả

FoodOrder Team

---

**Lưu ý:** Đây là phiên bản development. Để deploy production, cần cấu hình thêm bảo mật, HTTPS, và các biến môi trường production.


