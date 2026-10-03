const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  // Replace 'http://localhost:5000...' with `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}...`
  // Handle single quotes
  newContent = newContent.replace(/'http:\/\/localhost:5000([^']*)'/g, "`\\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}$1`");
  // Handle template literals
  newContent = newContent.replace(/`http:\/\/localhost:5000([^`]*)`/g, "`\\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}$1`");

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      replaceInFile(filePath);
    }
  }
}

walkDir(srcDir);
console.log('Replacement complete.');
