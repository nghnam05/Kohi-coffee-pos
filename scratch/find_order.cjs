const mongoose = require('c:/Users/NAM/kohi-coffee/backend/node_modules/mongoose');
const uri = 'mongodb+srv://namnh4581_db_user:50SAWO4UGkULnCaM@cluster1.5eudgkz.mongodb.net/kohi-coffee';

async function findOrder() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const allOrders = await db.collection('orders').find({}).toArray();
  const match = allOrders.find(o => o._id.toString().toUpperCase().endsWith('8C315'));
  if (match) {
    console.log('Order found!');
    console.log('Order ID:', match._id);
    console.log('createdAt:', match.createdAt);
    console.log('paidAt:', match.paidAt);
    console.log('createdAt VN time:', new Date(match.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
  } else {
    console.log('No order ending in 8C315. Total orders in DB:', allOrders.length);
    // Print a few sample orders and their dates
    console.log('Sample 5 orders dates:');
    allOrders.slice(0, 5).forEach(o => {
      console.log(o._id.toString().slice(-5).toUpperCase(), o.createdAt);
    });
  }
  await mongoose.disconnect();
}

findOrder().catch(console.error);
