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
        // Món chính
        {
          name: 'Cơm Sườn Nướng',
          description: 'Cơm trắng dẻo thơm kèm sườn heo nướng mật ong đậm đà, ăn kèm đồ chua và nước mắm pha.',
          price: 55000,
          category: 'main',
          image: '/images/com-suon-nuong.jpg'
        },
        {
          name: 'Phở Bò Tái Chín',
          description: 'Phở bò nước dùng hầm xương 12 tiếng, thịt bò tái chín mềm, kèm rau thơm và giá đỗ tươi.',
          price: 65000,
          category: 'main',
          image: '/images/pho-bo.jpg'
        },
        {
          name: 'Bún Bò Huế',
          description: 'Bún bò Huế cay nồng đặc trưng, nước dùng sả hả đỏ thơm, thịt bò và chả cua.',
          price: 60000,
          category: 'main',
          image: '/images/bun-bo-hue.jpg'
        },
        {
          name: 'Cơm Gà Hội An',
          description: 'Cơm gà vàng ươm nấu với nước luộc gà, thịt gà xé phay thơm ngọt, ăn kèm tương ớt.',
          price: 60000,
          category: 'main',
          image: '/images/com-ga.jpg'
        },
        {
          name: 'Bánh Mì Thịt Đặc Biệt',
          description: 'Bánh mì giòn rụm nhân thịt nguội, pate, chả lụa, rau thơm, dưa chuột và tương ớt.',
          price: 35000,
          category: 'main',
          image: '/images/banh-mi.jpg'
        },
        {
          name: 'Mì Quảng Tôm Thịt',
          description: 'Mì Quảng sợi vàng đặc trưng, tôm tươi và thịt heo nước dùng đậm đà, rắc đậu phộng rang.',
          price: 58000,
          category: 'main',
          image: '/images/mi-quang.jpg'
        },
        {
          name: 'Lẩu Thái Hải Sản',
          description: 'Lẩu Thái chua cay với tôm, mực, nghêu tươi, nấm và rau sống theo mùa. Phục vụ 2 người.',
          price: 250000,
          category: 'main',
          image: '/images/lau-thai.jpg'
        },
        {
          name: 'Gà Nướng Muối Ớt',
          description: 'Gà ta nướng muối ớt vàng giòn bên ngoài, thịt thơm mềm bên trong, ăn kèm cơm chiên.',
          price: 120000,
          category: 'main',
          image: '/images/ga-nuong.jpg'
        },
        // Tráng miệng
        {
          name: 'Chè Khúc Bạch',
          description: 'Chè khúc bạch hạnh nhân mềm mịn, thạch sương sáo, trái vải và nước đường thơm.',
          price: 35000,
          category: 'dessert',
          image: '/images/che-khuc-bach.jpg'
        },
        {
          name: 'Bánh Flan Caramel',
          description: 'Bánh flan mềm mịn kiểu Pháp với lớp caramel vàng óng, thưởng thức lạnh cùng cà phê đen.',
          price: 25000,
          category: 'dessert',
          image: '/images/banh-flan.jpg'
        },
        {
          name: 'Kem Dừa Trái Cây',
          description: 'Kem dừa tươi béo ngậy đựng trong trái dừa, kèm trái cây nhiệt đới theo mùa.',
          price: 45000,
          category: 'dessert',
          image: '/images/kem-dua.jpg'
        },
        {
          name: 'Chè Ba Màu',
          description: 'Chè ba màu truyền thống: đậu đỏ, đậu xanh, thạch pandan, nước cốt dừa và đá bào mát lạnh.',
          price: 30000,
          category: 'dessert',
          image: '/images/che-ba-mau.jpg'
        },
        // Đồ uống
        {
          name: 'Cà Phê Sữa Đá',
          description: 'Cà phê phin truyền thống pha với sữa đặc ngọt béo, uống với đá viên mát lạnh.',
          price: 30000,
          category: 'drink',
          image: '/images/ca-phe-sua-da.jpg'
        },
        {
          name: 'Sinh Tố Bơ',
          description: 'Sinh tố bơ sáp Đắk Lắk xay nhuyễn với sữa tươi và đường, béo ngậy thơm ngon.',
          price: 45000,
          category: 'drink',
          image: '/images/sinh-to-bo.jpg'
        },
        {
          name: 'Nước Ép Cam Tươi',
          description: 'Cam vàng tươi ép nguyên chất, không thêm đường, giàu vitamin C bổ dưỡng.',
          price: 40000,
          category: 'drink',
          image: '/images/nuoc-ep-cam.jpg'
        },
        {
          name: 'Trà Sữa Trân Châu',
          description: 'Trà sữa đài loan với trân châu đen dẻo dai, có thể chọn mức đường và đá theo ý thích.',
          price: 45000,
          category: 'drink',
          image: '/images/tra-sua.jpg'
        },
        {
          name: 'Nước Dừa Tươi',
          description: 'Nước dừa xiêm tươi mát, ngọt tự nhiên, không pha chế thêm. Phục vụ cả trái.',
          price: 35000,
          category: 'drink',
          image: '/images/nuoc-dua.jpg'
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

