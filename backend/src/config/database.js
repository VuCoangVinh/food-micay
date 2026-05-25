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

