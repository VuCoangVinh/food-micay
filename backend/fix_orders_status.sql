-- Update existing orders from 'completed' to 'pending'
-- This ensures only actually paid orders are counted in revenue
UPDATE orders SET status = 'pending' WHERE status = 'completed';

-- Verify the update
SELECT id, status, total_price, created_at FROM orders ORDER BY id DESC LIMIT 10;
