import db from '../config/database.js';

export const getAllUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    
    let query = 'SELECT id, name, email, role, created_at FROM users WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (role && role !== 'all') {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const users = await db.all(query, params);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách người dùng' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);

    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông tin người dùng' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting admin users
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Không thể xóa tài khoản admin' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa người dùng' });
  }
};















