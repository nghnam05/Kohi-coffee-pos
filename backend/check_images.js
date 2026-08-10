const fs = require('fs');
const path = require('path');
const https = require('https');

const seedContent = fs.readFileSync(path.join(__dirname, 'seed.js'), 'utf-8');

// Find all matches of image: '...'
const imageRegex = /image:\s*'([^']+)'/g;
let match;
const urls = [];
while ((match = imageRegex.exec(seedContent)) !== null) {
  urls.push(match[1]);
}

console.log(`Found ${urls.length} image URLs in seed.js. Checking for accessibility...`);

const uniqueUrls = [...new Set(urls)];
console.log(`Unique URLs count: ${uniqueUrls.length}`);

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, statusCode: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, statusCode: 500, error: err.message });
    });
  });
}

async function run() {
  const results = [];
  for (const url of uniqueUrls) {
    const res = await checkUrl(url);
    results.push(res);
    console.log(`${res.statusCode === 200 ? '✅' : '❌'} [${res.statusCode}] ${url}`);
  }
  const failed = results.filter(r => r.statusCode !== 200);
  console.log(`\nResults: ${uniqueUrls.length - failed.length} ok, ${failed.length} failed.`);
}

run();
