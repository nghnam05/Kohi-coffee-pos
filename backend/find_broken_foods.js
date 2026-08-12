const fs = require('fs');
const path = require('path');

const seedContent = fs.readFileSync(path.join(__dirname, 'seed.js'), 'utf-8');

const brokenUrls = [
  'https://images.unsplash.com/photo-1617421731671-5caee6c43422?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594756202469-9ff9799a2e4e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541696497-8748a3ed7423?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618411640018-97108990cf2b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1547928576-a4a33237ce35?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1603133872878-685f5082c64a?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-155126634-323283e090fa?w=800&auto=format&fit=crop&q=80'
];

// parse foods block from seed.js
// foods is defined as const foods = [ ... ]
// We will extract all items inside foods array
const matchFoods = seedContent.match(/const foods = \[\s*([\s\S]*?)\n\];/);
if (!matchFoods) {
  console.log("Could not find foods array in seed.js");
  process.exit(1);
}

const foodsText = matchFoods[1];
// Find individual food objects
const foodItemsText = foodsText.split(/\},?\s*\{/);

const foods = [];
foodItemsText.forEach((itemText, index) => {
  // Extract name and image
  const nameMatch = itemText.match(/name:\s*'([^']+)'/);
  const imageMatch = itemText.match(/image:\s*'([^']+)'/);
  if (nameMatch && imageMatch) {
    foods.push({
      index,
      name: nameMatch[1],
      image: imageMatch[1]
    });
  }
});

console.log(`Parsed ${foods.length} foods from seed.js.`);

const brokenFoods = [];
foods.forEach(f => {
  if (brokenUrls.includes(f.image)) {
    brokenFoods.push(f);
    console.log(`Index ${f.index}: "${f.name}" uses broken image: ${f.image}`);
  }
});

console.log(`\nTotal foods with broken images: ${brokenFoods.length}`);
