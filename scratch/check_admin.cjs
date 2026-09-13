const mongoose = require('c:/Users/NAM/kohi-coffee/backend/node_modules/mongoose');
const uri = 'mongodb+srv://namnh4581_db_user:50SAWO4UGkULnCaM@cluster1.5eudgkz.mongodb.net/kohi-coffee';

async function checkAdmin() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const admin = await db.collection('users').findOne({ role: 'admin' });
  console.log('Admin user in DB:', admin?.email, admin?.username, admin?.password ? 'has password hash' : 'no password');
  await mongoose.disconnect();
}

checkAdmin().catch(console.error);
