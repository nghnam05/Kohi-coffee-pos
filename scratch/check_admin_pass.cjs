const mongoose = require('c:/Users/NAM/kohi-coffee/backend/node_modules/mongoose');
const bcrypt = require('c:/Users/NAM/kohi-coffee/backend/node_modules/bcrypt');
const uri = 'mongodb+srv://namnh4581_db_user:50SAWO4UGkULnCaM@cluster1.5eudgkz.mongodb.net/kohi-coffee';

async function checkPass() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const admin = await db.collection('users').findOne({ role: 'admin' });
  const candidates = ['123', 'admin', 'admin123', 'admin@123', '123456', 'kohi123', 'adminpassword123', 'kohi@123', 'kohi2026', 'password'];
  for (const c of candidates) {
    if (await bcrypt.compare(c, admin.password)) {
      console.log('Admin password is:', c);
      break;
    }
  }
  await mongoose.disconnect();
}

checkPass().catch(console.error);
