const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT_DIR = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Parse URL and remove query string
  let urlPath = req.url.split('?')[0];
  
  // Convert /filename to filename for root-level files
  if (urlPath.startsWith('/')) {
    urlPath = urlPath.substring(1);
  }
  
  // Default to index.html for root path
  if (urlPath === '') {
    urlPath = 'index.html';
  }
  
  let filePath = path.join(ROOT_DIR, urlPath);
  
  // Security: prevent directory traversal
  const normalizedFilePath = path.normalize(filePath);
  const normalizedRootDir = path.normalize(ROOT_DIR);
  if (!normalizedFilePath.startsWith(normalizedRootDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🌐 Frontend server running at http://localhost:${PORT}`);
  console.log(`📂 Serving files from: ${ROOT_DIR}\n`);
});
