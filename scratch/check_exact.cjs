const mongoose = require('c:/Users/NAM/kohi-coffee/backend/node_modules/mongoose');
const uri = 'mongodb+srv://namnh4581_db_user:50SAWO4UGkULnCaM@cluster1.5eudgkz.mongodb.net/kohi-coffee';

async function checkExact() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // Let's check day 08: 2026-09-08 00:00:00 to 23:59:59 VN time (2026-09-07T17:00:00Z to 2026-09-08T16:59:59.999Z)
  const d08Start = new Date('2026-09-07T17:00:00.000Z');
  const d08End = new Date('2026-09-08T16:59:59.999Z');

  const orders08 = await db.collection('orders').find({
    paidAt: { $gte: d08Start, $lte: d08End }
  }).toArray();
  const total08 = orders08.reduce((s, o) => s + (o.totalAmount || 0), 0);
  console.log('DB day 08/09:', orders08.length, 'orders, total amount:', total08);

  // Check order #8C315
  const sample = orders08.find(o => o._id.toString().toUpperCase().endsWith('8C315') || o._id.toString().toUpperCase().endsWith('C315'));
  console.log('Sample order ending in C315 in day 08?:', sample?._id);

  // Let's check day 13: 2026-09-13 00:00:00 to 23:59:59 VN time (2026-09-12T17:00:00Z to 2026-09-13T16:59:59.999Z)
  const d13Start = new Date('2026-09-12T17:00:00.000Z');
  const d13End = new Date('2026-09-13T16:59:59.999Z');
  const orders13 = await db.collection('orders').find({
    paidAt: { $gte: d13Start, $lte: d13End }
  }).toArray();
  const total13 = orders13.reduce((s, o) => s + (o.totalAmount || 0), 0);
  console.log('DB day 13/09:', orders13.length, 'orders, total amount:', total13);

  const sample13 = orders13.find(o => o._id.toString().toUpperCase().endsWith('8C315') || o._id.toString().toUpperCase().endsWith('C315') || o._id.toString().toUpperCase().endsWith('315'));
  console.log('Sample order ending in 315 in day 13?:', sample13?._id);

  await mongoose.disconnect();
}

checkExact().catch(console.error);
