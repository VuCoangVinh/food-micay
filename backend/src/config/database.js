import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../database.sqlite');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Promisify database methods
// db.run needs special handling to return lastID
const originalRun = db.run.bind(db);
db.run = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    originalRun(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};
db.get = promisify(db.get.bind(db));
db.all = promisify(db.all.bind(db));

// Initialize database tables
export const initDatabase = async () => {
  try {
    // Users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Menu items table
    await db.run(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tables table
    await db.run(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        capacity INTEGER DEFAULT 4,
        status TEXT DEFAULT 'available',
        qr_code_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        table_id INTEGER,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        table_number TEXT,
        number_of_guests INTEGER,
        items TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (table_id) REFERENCES tables(id)
      )
    `);

    // Daily Revenue table
    await db.run(`
      CREATE TABLE IF NOT EXISTS daily_revenue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        total_revenue REAL DEFAULT 0,
        completed_orders INTEGER DEFAULT 0,
        total_orders INTEGER DEFAULT 0,
        average_order_value REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user if not exists
    const bcrypt = (await import('bcryptjs')).default;
    const adminExists = await db.get('SELECT * FROM users WHERE email = ?', ['admin@foodorder.com']);
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@foodorder.com', hashedPassword, 'admin']
      );
      console.log('Default admin user created: admin@foodorder.com / admin123');
    }

    // Create default tables if not exists
    const tablesCount = await db.get('SELECT COUNT(*) as count FROM tables');
    if (tablesCount.count === 0) {
      for (let i = 1; i <= 5; i++) {
        await db.run(
          'INSERT INTO tables (name, capacity, status) VALUES (?, ?, ?)',
          [`Bàn ${i}`, 4, 'available']
        );
      }
      console.log('Default tables created');
    }

    // Seed default menu items if not exists
    const menuCount = await db.get('SELECT COUNT(*) as count FROM menu_items');
    if (menuCount.count === 0) {
      const defaultMenuItems = [
        // Mì cay
        {
          name: 'Mì Cay Cấp Độ 1',
          description: 'Mì cay nhẹ, thích hợp cho người mới thử, nước dùng đậm đà vừa miệng.',
          price: 35000,
          category: 'main',
          image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Mì Cay Cấp Độ 3',
          description: 'Mì cay vừa, vị cay nồng hòa quyện với nước dùng thơm ngon hấp dẫn.',
          price: 40000,
          category: 'main',
          image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Mì Cay Cấp Độ 5',
          description: 'Mì cay cao cấp, thử thách vị giác với độ cay đậm đà đặc trưng.',
          price: 45000,
          category: 'main',
          image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Mì Cay Cấp Độ 7',
          description: 'Mì cay cực kỳ, dành cho tín đồ ăn cay thực thụ, thử thách giới hạn bản thân.',
          price: 50000,
          category: 'main',
          image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Mì Cay Hải Sản',
          description: 'Mì cay kết hợp tôm tươi, mực và viên cá, nước dùng hải sản đậm đà thơm ngon.',
          price: 55000,
          category: 'main',
          image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Mì Cay Bò Viên',
          description: 'Mì cay với bò viên dai giòn, nước dùng bò hầm cay nồng đặc biệt.',
          price: 50000,
          category: 'main',
          image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=300&fit=crop&auto=format'
        },
        // Tráng miệng
        {
          name: 'Caramen',
          description: 'Caramen béo ngậy, lớp caramel vàng óng mịn màng, thưởng thức lạnh.',
          price: 25000,
          category: 'dessert',
          image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Tào Phớ',
          description: 'Tào phớ mát lạnh mềm mịn, chan nước đường gừng thơm ngọt thanh mát.',
          price: 20000,
          category: 'dessert',
          image: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Chè Đậu Xanh',
          description: 'Chè đậu xanh nấu mịn với nước cốt dừa béo ngậy, ăn nóng hoặc lạnh đều ngon.',
          price: 20000,
          category: 'dessert',
          image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Pudding Trứng',
          description: 'Pudding trứng kiểu Nhật mềm mịn tan trong miệng, thơm ngậy vị sữa.',
          price: 25000,
          category: 'dessert',
          image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Kem Que Matcha',
          description: 'Kem que matcha Nhật Bản vị đắng nhẹ đặc trưng, phủ socola giòn bên ngoài.',
          price: 20000,
          category: 'dessert',
          image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop&auto=format'
        },
        // Đồ uống
        {
          name: 'Trà Sữa Trân Châu',
          description: 'Trà sữa đài loan trân châu đen dẻo dai, có thể tùy chọn mức đường và đá.',
          price: 35000,
          category: 'drink',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Cà Phê Sữa Đá',
          description: 'Cà phê phin truyền thống pha với sữa đặc, uống cùng đá viên mát lạnh.',
          price: 25000,
          category: 'drink',
          image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Nước Chanh Dây',
          description: 'Nước chanh dây tươi chua ngọt tự nhiên, không chất bảo quản, giải khát tuyệt vời.',
          price: 25000,
          category: 'drink',
          image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Trà Đào Cam Sả',
          description: 'Trà đào thơm mát pha cùng cam tươi và sả, thanh mát dễ uống.',
          price: 30000,
          category: 'drink',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Sinh Tố Bơ',
          description: 'Sinh tố bơ sáp xay nhuyễn với sữa tươi, béo ngậy thơm ngon bổ dưỡng.',
          price: 35000,
          category: 'drink',
          image: 'https://images.unsplash.com/photo-1638176066600-c58e3571c25c?w=400&h=300&fit=crop&auto=format'
        },
        {
          name: 'Nước Ép Cam Tươi',
          description: 'Cam tươi ép nguyên chất không thêm đường, giàu vitamin C bổ dưỡng.',
          price: 30000,
          category: 'drink',
          image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&auto=format'
        },
      ];
      
      for (const item of defaultMenuItems) {
        await db.run(
          'INSERT INTO menu_items (name, description, price, category, image) VALUES (?, ?, ?, ?, ?)',
          [item.name, item.description, item.price, item.category, item.image]
        );
      }
      console.log(`✅ ${defaultMenuItems.length} default menu items created`);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default db;

