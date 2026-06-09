import db from '../config/database.js';

export const getAllMenuItems = async (req, res) => {
  try {
    const { category } = req.query;
    
    const categoryOrder = `CASE category WHEN 'main' THEN 0 WHEN 'drink' THEN 1 WHEN 'dessert' THEN 2 ELSE 99 END`;
    let query = `SELECT * FROM menu_items ORDER BY ${categoryOrder}, created_at DESC`;
    let params = [];

    if (category && category !== 'all') {
      query = `SELECT * FROM menu_items WHERE category = ? ORDER BY ${categoryOrder}, created_at DESC`;
      params = [category];
    }

    const items = await db.all(query, params);
    res.json(items);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách món ăn' });
  }
};

export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await db.get('SELECT * FROM menu_items WHERE id = ?', [id]);

    if (!item) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông tin món ăn' });
  }
};

export const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, quantity } = req.body;

    // Validation
    if (!name || !description || !price || !category) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (name.length < 2) {
      return res.status(400).json({ error: 'Tên món ăn phải có ít nhất 2 ký tự' });
    }

    if (description.length < 10) {
      return res.status(400).json({ error: 'Mô tả phải có ít nhất 10 ký tự' });
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 1000 || priceValue > 10000000) {
      return res.status(400).json({ error: 'Giá không hợp lệ (1,000 - 10,000,000 VND)' });
    }

    let quantityValue = null;
    if (quantity !== undefined && quantity !== null && quantity !== '') {
      quantityValue = parseInt(quantity);
      if (isNaN(quantityValue) || quantityValue < 0) {
        return res.status(400).json({ error: 'Số lượng không hợp lệ (phải >= 0)' });
      }
    }

    const result = await db.run(
      'INSERT INTO menu_items (name, description, price, category, image, quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), description.trim(), priceValue, category, image || null, quantityValue]
    );

    const newItem = await db.get('SELECT * FROM menu_items WHERE id = ?', [result.lastID]);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi thêm món ăn' });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image, quantity } = req.body;

    // Check if item exists
    const existingItem = await db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (!existingItem) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }

    // Validation
    if (name && name.length < 2) {
      return res.status(400).json({ error: 'Tên món ăn phải có ít nhất 2 ký tự' });
    }

    if (description && description.length < 10) {
      return res.status(400).json({ error: 'Mô tả phải có ít nhất 10 ký tự' });
    }

    if (price) {
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue < 1000 || priceValue > 10000000) {
        return res.status(400).json({ error: 'Giá không hợp lệ (1,000 - 10,000,000 VND)' });
      }
    }

    let quantityValue = existingItem.quantity;
    if (quantity !== undefined) {
      if (quantity === null || quantity === '') {
        quantityValue = null;
      } else {
        quantityValue = parseInt(quantity);
        if (isNaN(quantityValue) || quantityValue < 0) {
          return res.status(400).json({ error: 'Số lượng không hợp lệ (phải >= 0)' });
        }
      }
    }

    await db.run(
      'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, image = ?, quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        name?.trim() || existingItem.name,
        description?.trim() || existingItem.description,
        price ? parseFloat(price) : existingItem.price,
        category || existingItem.category,
        image !== undefined ? image : existingItem.image,
        quantityValue,
        id
      ]
    );

    const updatedItem = await db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
    res.json(updatedItem);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật món ăn' });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }

    await db.run('DELETE FROM menu_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa món ăn thành công' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa món ăn' });
  }
};















