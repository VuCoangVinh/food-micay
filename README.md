# FoodOrder - Hệ Thống Đặt Món Online

Hệ thống quản lý đặt món cho nhà hàng với giao diện người dùng và quản trị viên. Thanh toán tiền mặt tại nhà hàng.

## Tính Năng

- Quản lý người dùng: Đăng ký, đăng nhập, phân quyền (User/Admin)
- Quản lý menu: Thêm, sửa, xóa món ăn, upload ảnh món
- Quản lý bàn: Tạo, cập nhật, xóa bàn
- Đặt hàng: Thêm vào giỏ, đặt món, theo dõi trạng thái đơn hàng
- Thanh toán: Tiền mặt tại nhà hàng
- Dashboard admin: Quản lý đơn hàng, thống kê doanh thu

## Công Nghệ

### Backend
- Node.js + Express
- SQLite
- JWT (Authentication)
- Multer (Upload ảnh)

### Frontend
- React 19
- Vite
- React Router

## Yêu Cầu Hệ Thống

- Node.js >= 18.x
- npm

## Cài Đặt

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
cd frontend
npm install
```

## Cấu Hình

### Backend — tạo file `backend/.env`
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key-here
```

### Frontend — tạo file `frontend/.env`
```env
VITE_API_URL=http://localhost:3001/api
```

## Chạy Ứng Dụng

**Backend:**
```bash
cd backend
npm run dev
```
Chạy tại: http://localhost:3001

**Frontend:**
```bash
cd frontend
npm run dev
```
Chạy tại: http://localhost:5173

## Tài Khoản Mặc Định

Hệ thống tự động tạo khi khởi động lần đầu:

| Vai trò | Email | Password |
|---------|-------|----------|
| Admin | admin@foodorder.com | admin123 |

Database cũng tự động tạo 5 bàn và các món ăn mẫu.

## Cấu Trúc Dự Án

```
Order_Frontend/
├── backend/
│   ├── src/
│   │   ├── config/        # Cấu hình database
│   │   ├── controllers/   # Logic xử lý
│   │   ├── middleware/    # Auth middleware
│   │   └── routes/        # API routes
│   ├── uploads/           # Ảnh upload
│   └── database.sqlite    # SQLite database (tự động tạo)
│
└── frontend/
    └── src/
        ├── components/    # React components
        ├── contexts/      # Context API (auth, cart)
        ├── pages/         # Các trang
        ├── services/      # Gọi API (api.js)
        └── utils/         # Tiện ích
```

## API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/login | Đăng nhập |

### Menu
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/menu | Lấy danh sách món |
| GET | /api/menu/:id | Lấy chi tiết món |
| POST | /api/menu | Thêm món (Admin) |
| PUT | /api/menu/:id | Sửa món (Admin) |
| DELETE | /api/menu/:id | Xóa món (Admin) |

### Orders
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/orders | Tạo đơn hàng |
| GET | /api/orders/:id | Lấy chi tiết đơn |
| GET | /api/orders/user/:userId | Đơn hàng của user |
| GET | /api/orders | Tất cả đơn hàng (Admin) |
| PUT | /api/orders/:id/status | Cập nhật trạng thái (Admin) |

### Tables
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/tables | Lấy danh sách bàn |
| GET | /api/tables/:id | Lấy chi tiết bàn |
| POST | /api/tables | Tạo bàn (Admin) |
| PUT | /api/tables/:id | Cập nhật bàn (Admin) |
| DELETE | /api/tables/:id | Xóa bàn (Admin) |

### Users (Admin)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/users | Danh sách người dùng |
| GET | /api/users/:id | Chi tiết người dùng |
| DELETE | /api/users/:id | Xóa người dùng |

### Upload (Admin)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/upload/image | Upload ảnh món ăn |

## Xử Lý Sự Cố

**Database lỗi:** Xóa `backend/database.sqlite` và khởi động lại để tạo lại database.

**Port bị chiếm:** Đổi `PORT` trong `backend/.env`.
