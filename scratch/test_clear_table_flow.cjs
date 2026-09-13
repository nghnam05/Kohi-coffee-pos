const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const MONGODB_URI = 'mongodb+srv://namnh4581_db_user:50SAWO4UGkULnCaM@cluster1.5eudgkz.mongodb.net/kohi-coffee';
const JWT_SECRET = 'chika_restaurant_jwt_secret_key_2026_super_secure';

async function testFlow() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const admin = await db.collection('users').findOne({ role: 'admin' });
  const token = jwt.sign({ id: admin._id, role: admin.role, email: admin.email }, JWT_SECRET, { expiresIn: '1h' });

  // Get table 1
  const table = await db.collection('tables').findOne({ tableName: 'Bàn số 1' });
  console.log('Target Table:', table.tableName, 'ID:', table._id.toString(), 'Initial status:', table.status);

  // Get a food item
  const food = await db.collection('foods').findOne({});

  // 1. Create an active order on Table 1
  const createOrderRes = await fetch('http://localhost:3001/api/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tableId: table._id.toString(),
      items: [{ foodId: food._id.toString(), quantity: 2, note: 'Test clear modal' }]
    })
  });
  const orderData = await createOrderRes.json();
  console.log('Order creation response:', orderData);
  const orderId = orderData._id || orderData.id || (orderData.data && (orderData.data._id || orderData.data.id));
  console.log('Created order on Table 1:', orderId);

  // Check active orders on table
  const activeOrdersBefore = await db.collection('orders').find({
    $or: [{ tableId: table._id }, { tableId: table._id.toString() }],
    status: { $nin: ['paid', 'cancelled'] }
  }).toArray();
  console.log(`Active orders before clearing: ${activeOrdersBefore.length}`);

  // 2. Simulate User confirming table clear: PUT /api/v1/tables/:id with { status: 'empty' }
  const clearRes = await fetch(`http://localhost:3001/api/v1/tables/${table._id.toString()}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'empty' })
  });
  const clearData = await clearRes.json();
  console.log('Clear Table Response status:', clearRes.status, 'Data:', clearData.data ? clearData.data.status : clearData.status);

  // 3. Verify in DB
  const tableAfter = await db.collection('tables').findOne({ _id: table._id });
  const activeOrdersAfter = await db.collection('orders').find({
    tableId: table._id,
    status: { $nin: ['paid', 'cancelled'] }
  }).toArray();

  const testOrderAfter = await db.collection('orders').findOne({ _id: new mongoose.Types.ObjectId(orderId) });

  console.log('Table status in DB after clear:', tableAfter.status);
  console.log(`Active orders after clear: ${activeOrdersAfter.length}`);
  console.log('Test order status in DB after clear:', testOrderAfter ? testOrderAfter.status : 'not found');

  if (tableAfter.status === 'empty' && activeOrdersAfter.length === 0 && testOrderAfter.status === 'cancelled') {
    console.log('>>> VERIFICATION SUCCESS: Table cleared and all orders cancelled!');
  } else {
    console.error('>>> VERIFICATION FAILED!');
  }

  await mongoose.disconnect();
}

testFlow().catch(console.error);
