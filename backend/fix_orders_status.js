import db from './src/config/database.js';

async function fixOrdersStatus() {
  try {
    console.log('🔄 Updating existing orders from "completed" to "pending"...');
    
    // Update all completed orders to pending
    const result = await db.run(
      "UPDATE orders SET status = 'pending' WHERE status = 'completed'"
    );
    
    console.log(`✅ Updated ${result.changes} orders from 'completed' to 'pending'`);
    
    // Verify the update
    const orders = await db.all("SELECT id, status, total_price, created_at FROM orders ORDER BY id DESC LIMIT 10");
    console.log('\n📋 Recent orders after update:');
    orders.forEach(order => {
      console.log(`   Order #${order.id}: status=${order.status}, total=${order.total_price}`);
    });
    
    console.log('\n✅ Done! Please restart the backend server.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOrdersStatus();
