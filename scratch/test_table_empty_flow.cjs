const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kohi-coffee');
  console.log('Connected to MongoDB');

  const Table = mongoose.model('Table', new mongoose.Schema({
    tableName: String,
    status: String,
    currentSessionStartedAt: Date,
    qrToken: String,
  }));

  const Order = mongoose.model('Order', new mongoose.Schema({
    tableId: mongoose.Schema.Types.ObjectId,
    status: String,
    isDeleted: Boolean,
    totalAmount: Number,
  }));

  const tables = await Table.find({}).lean();
  console.log(`Found ${tables.length} tables`);
  const table1 = tables[0];
  console.log('Table 1:', table1.tableName, table1._id.toString(), table1.status);

  // Check orders for Table 1
  const orders = await Order.find({ tableId: table1._id }).lean();
  console.log(`Orders for ${table1.tableName}: ${orders.length}`);
  const activeOrders = orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled');
  console.log(`Active orders: ${activeOrders.length}`);

  // Create a test order if none
  let testOrderId;
  if (activeOrders.length === 0) {
    const newOrd = await Order.create({
      tableId: table1._id,
      status: 'cooking',
      totalAmount: 50000,
    });
    testOrderId = newOrd._id;
    console.log('Created test order:', testOrderId);
  }

  // Now let's call the API PUT /api/v1/tables/:id
  const fetch = (await import('node-fetch')).default;
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@kohi.vn', password: 'admin' }),
  });
  const { access_token } = await loginRes.json();
  console.log('Admin token obtained');

  const putRes = await fetch(`http://localhost:3001/api/v1/tables/${table1._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ status: 'empty' }),
  });
  console.log('PUT response status:', putRes.status);
  const putData = await putRes.json();
  console.log('PUT response body:', putData);

  // Check order status now
  const updatedOrders = await Order.find({ tableId: table1._id }).lean();
  const remainingActive = updatedOrders.filter(o => o.status !== 'paid' && o.status !== 'cancelled');
  console.log(`Remaining active orders for ${table1.tableName}: ${remainingActive.length}`);
  remainingActive.forEach(o => console.log(' - Order:', o._id, 'status:', o.status));

  // Clean up if we created test order
  if (testOrderId) {
    await Order.findByIdAndDelete(testOrderId);
    console.log('Cleaned up test order');
  }

  await mongoose.disconnect();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
