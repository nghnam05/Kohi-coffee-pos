const mongoose = require('mongoose');

const uri = 'mongodb+srv://namnh4581_db_user:50SAWO4UGkULnCaM@cluster1.5eudgkz.mongodb.net/kohi-coffee';

async function executeCleanData() {
  console.log('====================================================');
  console.log('🧹 KOHI COFFEE POS - SYSTEM DATA SANITIZATION & CLEAN');
  console.log('====================================================\n');

  console.log('Connecting to MongoDB Atlas (kohi-coffee)...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Transactional and Operational Collections to Purge
  const operationalCollections = [
    'orders',
    'payments',
    'reservations',
    'attendances',
    'shiftswaprequests',
    'staffcalls',
    'reviews',
    'expenses',
    'ingredientusages',
    'payrolls',
    'coupons',
  ];

  console.log('--- 1. PURGING OPERATIONAL & TEST TRANSACTIONS ---');
  for (const colName of operationalCollections) {
    try {
      const result = await db.collection(colName).deleteMany({});
      console.log(`  ✓ Cleared [${colName}]: deleted ${result.deletedCount} document(s)`);
    } catch (err) {
      console.log(`  - [${colName}] not found or already empty (${err.message})`);
    }
  }

  // 2. Remove Temporary / Test User Accounts
  console.log('\n--- 2. CLEANING TEST ACCOUNTS ---');
  const deletedTestUsers = await db.collection('users').deleteMany({
    $or: [
      { email: 'test_u@kohi.vn' },
      { email: { $regex: /test/i } },
      { name: { $regex: /test/i } },
    ],
  });
  console.log(`  ✓ Removed ${deletedTestUsers.deletedCount} test user account(s)`);

  // 3. Reset Table Statuses & Generate Fresh QR Tokens
  console.log('\n--- 3. RESETTING TABLES TO PRISTINE EMPTY STATE ---');
  const tables = await db.collection('tables').find({}).toArray();
  let resetCount = 0;

  for (const table of tables) {
    const freshToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    await db.collection('tables').updateOne(
      { _id: table._id },
      {
        $set: {
          status: 'empty',
          qrToken: table.qrToken || freshToken,
          currentSessionStartedAt: null,
          occupants: [],
          activeOrdersCount: 0,
        },
      }
    );
    resetCount++;
  }
  console.log(`  ✓ Reset ${resetCount} tables to status "empty" with valid active qrTokens`);

  // 4. Summarize Preserved Master Data
  console.log('\n--- 4. VERIFYING PRESERVED MASTER DATA ---');
  const allCollections = await db.listCollections().toArray();
  for (const col of allCollections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  • ${col.name.padEnd(22)}: ${count} record(s)`);
  }

  console.log('\n--- 5. ACTIVE STAFF & MANAGEMENT ACCOUNTS ---');
  const activeStaff = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
  activeStaff.forEach((u) => {
    console.log(`  👤 [${u.role.toUpperCase().padEnd(7)}] ${u.name.padEnd(28)} | ${u.email}`);
  });

  await mongoose.disconnect();
  console.log('\n====================================================');
  console.log('✨ DATABASE CLEAN COMPLETED SUCCESSFULLY (PRODUCTION READY)');
  console.log('====================================================');
}

executeCleanData().catch((err) => {
  console.error('Data cleaning error:', err);
  process.exit(1);
});
