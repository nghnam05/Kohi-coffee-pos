/**
 * KOHI COFFEE FRONTEND TEST RUNNER
 * Executes all test suites in frontend/test:
 * 1. persona-audit.js
 * 2. reservation-flow.js
 * 3. frontend-comprehensive-qa.cjs
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('====================================================================');
console.log('🚀 EXECUTING ALL FRONTEND QA TEST SUITES');
console.log('====================================================================\n');

const suites = [
  'persona-audit.js',
  'reservation-flow.js',
  'frontend-comprehensive-qa.cjs'
];

let totalPassedSuites = 0;
let totalFailedSuites = 0;

for (const suite of suites) {
  const suitePath = path.join(__dirname, suite);
  console.log(`\n▶️ Running Suite: ${suite}`);
  console.log('--------------------------------------------------------------------');
  try {
    const output = execSync(`node "${suitePath}"`, { encoding: 'utf8' });
    console.log(output.trim());
    totalPassedSuites++;
    console.log(`✅ Suite ${suite}: PASSED`);
  } catch (err) {
    console.error(err.stdout || err.message);
    totalFailedSuites++;
    console.error(`❌ Suite ${suite}: FAILED`);
  }
}

console.log('\n====================================================================');
console.log('🏁 FRONTEND TEST RUNNER SUMMARY');
console.log('====================================================================');
console.log(`Suites Passed : ${totalPassedSuites} / ${suites.length}`);
console.log(`Suites Failed : ${totalFailedSuites} / ${suites.length}`);
console.log('====================================================================\n');

if (totalFailedSuites > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
