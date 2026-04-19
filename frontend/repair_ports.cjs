const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = content.replace(/http:\/\/127\.0\.0\.1:5001/g, '${import.meta.env.VITE_API_URL}');
      modified = modified.replace(/const baseUrl = '\$\{import\.meta\.env\.VITE_API_URL\}';/g, 'const baseUrl = import.meta.env.VITE_API_URL;');
      if(content !== modified) {
        fs.writeFileSync(fullPath, modified);
        console.log('Updated ' + file);
      }
    }
  });
}

walk(srcDir);
