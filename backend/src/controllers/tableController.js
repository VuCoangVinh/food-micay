import db from '../config/database.js';

export const getAllTables = async (req, res) => {
  try {
    const tables = await db.all('SELECT * FROM tables ORDER BY id ASC');
    
    // Generate QR code URLs for each table
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const tablesWithQR = tables.map(table => ({
      ...table,
      qrCodeUrl: `${baseUrl}/home?table=${table.id}`
    }));

    res.json(tablesWithQR);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách bàn' });
  }
};

export const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await db.get('SELECT * FROM tables WHERE id = ?', [id]);

    if (!table) {
      return res.status(404).json({ error: 'Bàn không tồn tại' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.json({
      ...table,
      qrCodeUrl: `${baseUrl}/home?table=${table.id}`
    });
  } catch (error) {
    console.error('Get table error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông tin bàn' });
  }
};

export const createTable = async (req, res) => {
  try {
    const { name, capacity, status } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên bàn không được để trống' });
    }

    const result = await db.run(
      'INSERT INTO tables (name, capacity, status) VALUES (?, ?, ?)',
      [name.trim(), capacity || 4, status || 'available']
    );

    const newTable = await db.get('SELECT * FROM tables WHERE id = ?', [result.lastID]);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    res.status(201).json({
      ...newTable,
      qrCodeUrl: `${baseUrl}/home?table=${newTable.id}`
    });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi tạo bàn' });
  }
};

export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, status } = req.body;

    const existingTable = await db.get('SELECT * FROM tables WHERE id = ?', [id]);
    if (!existingTable) {
      return res.status(404).json({ error: 'Bàn không tồn tại' });
    }

    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên bàn không được để trống' });
    }

    await db.run(
      'UPDATE tables SET name = ?, capacity = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        name?.trim() || existingTable.name,
        capacity !== undefined ? capacity : existingTable.capacity,
        status || existingTable.status,
        id
      ]
    );

    const updatedTable = await db.get('SELECT * FROM tables WHERE id = ?', [id]);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    res.json({
      ...updatedTable,
      qrCodeUrl: `${baseUrl}/home?table=${updatedTable.id}`
    });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật bàn' });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await db.get('SELECT * FROM tables WHERE id = ?', [id]);
    if (!table) {
      return res.status(404).json({ error: 'Bàn không tồn tại' });
    }

    await db.run('DELETE FROM tables WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa bàn thành công' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa bàn' });
  }
};















