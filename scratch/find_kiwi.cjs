const mongoose = require('c:/Users/NAM/kohi-coffee/backend/node_modules/mongoose');
const uri = 'mongodb+srv://namnh4581_db_user:50SAWO4UGkULnCaM@cluster1.5eudgkz.mongodb.net/kohi-coffee';

async function findKiwi() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const kiwiFood = await db.collection('foods').findOne({ name: { $regex: 'Kiwi Chanh Bạc Hà', $options: 'i' } });
  console.log('Kiwi food ID:', kiwiFood?._id);

  if (kiwiFood) {
    const ordersWithKiwi = await db.collection('orders').find({ 'items.foodId': kiwiFood._id }).toArray();
    console.log(`Found ${ordersWithKiwi.length} orders with Kiwi Chanh Bạc Hà:`);
    ordersWithKiwi.forEach(o => {
      console.log(`ID: ${o._id.toString().slice(-6).toUpperCase()}, paidAt: ${o.paidAt?.toISOString()}, total: ${o.totalAmount}, isTakeaway: ${o.isTakeaway}`);
    });
  }
  await mongoose.disconnect();
}

findKiwi().catch(console.error);
