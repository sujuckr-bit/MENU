const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Simple in-memory file cache with TTL and max entries
// Increase default TTL to 24 hours for aggressive caching
const DEFAULT_TTL = 1000 * 60 * 60 * 24; // 24 hours
const MAX_ENTRIES = 2000; // allow more entries for aggressive caching
const CACHE_DIR = path.join(__dirname, '.cache');
const CACHE_INDEX_FILE = path.join(CACHE_DIR, 'index.json');
const SAVE_INTERVAL = 1000 * 60 * 5; // save every 5 minutes

const mimeMap = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

class FileCache {
  constructor(options = {}) {
    this.ttl = options.ttl || DEFAULT_TTL;
    this.max = options.max || MAX_ENTRIES;
    this.cache = new Map(); // key -> { buffer, mtimeMs, type, size, ts }
    this.saveTimer = null;
    this.initialized = false;
  }

  _getType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeMap[ext] || 'application/octet-stream';
  }

  // Detect if asset is versioned/hashed (e.g. .min.js, .min.css, or has hash in name)
  _isHashedAsset(filePath) {
    const basename = path.basename(filePath);
    // Match patterns: *.min.js, *.min.css, or files with hash-like patterns (e.g. file.abc123def.js)
    return /\.min\.(js|css)$/i.test(basename) || /\.[a-f0-9]{8,}\./.test(basename);
  }

  async _ensureCacheDir() {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (e) {
      console.warn('[FileCache] Could not create cache directory:', e.message);
    }
  }

  async _loadFromDisk() {
    try {
      await this._ensureCacheDir();
      const indexData = await fs.readFile(CACHE_INDEX_FILE, 'utf-8');
      const index = JSON.parse(indexData);
      let loaded = 0;
      for (const [key, { fileKey, mtimeMs, size, type, etag, lastModified, ts }] of Object.entries(index)) {
        const cacheFile = path.join(CACHE_DIR, fileKey);
        try {
          const buffer = await fs.readFile(cacheFile);
          this.cache.set(key, { buffer, mtimeMs, size, type, etag, lastModified, ts });
          loaded++;
        } catch (e) {
          // file missing, skip
        }
      }
      console.log(`[FileCache] Loaded ${loaded} entries from disk cache`);
      this.initialized = true;
    } catch (e) {
      console.log('[FileCache] No persistent cache found or error reading:', e.message);
      this.initialized = true;
    }
  }

  async _saveToDisk() {
    if (!this.initialized) return;
    try {
      await this._ensureCacheDir();
      const index = {};
      let saved = 0;
      for (const [key, { buffer, mtimeMs, size, type, etag, lastModified, ts }] of this.cache.entries()) {
        const fileKey = `${crypto.createHash('md5').update(key).digest('hex')}.bin`;
        const cacheFile = path.join(CACHE_DIR, fileKey);
        await fs.writeFile(cacheFile, buffer);
        index[key] = { fileKey, mtimeMs, size, type, etag, lastModified, ts };
        saved++;
      }
      await fs.writeFile(CACHE_INDEX_FILE, JSON.stringify(index, null, 2));
      console.log(`[FileCache] Saved ${saved} entries to disk cache`);
    } catch (e) {
      console.warn('[FileCache] Error saving to disk:', e.message);
    }
  }

  async init() {
    await this._loadFromDisk();
    // Auto-save periodically
    if (this.saveTimer) clearInterval(this.saveTimer);
    this.saveTimer = setInterval(() => this._saveToDisk(), SAVE_INTERVAL);
  }

  async _read(filePath) {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error('Not a file');
    const buffer = await fs.readFile(filePath);
    // Compute a cheap but effective ETag using size + mtime
    const etag = crypto
      .createHash('sha1')
      .update(String(stat.size))
      .update(String(Math.floor(stat.mtimeMs)))
      .digest('hex');
    const lastModified = new Date(stat.mtimeMs).toUTCString();
    return { buffer, mtimeMs: stat.mtimeMs, size: stat.size, type: this._getType(filePath), etag, lastModified };
  }

  _pruneIfNeeded() {
    if (this.cache.size <= this.max) return;
    // remove oldest entry
    let oldestKey = null;
    let oldestTs = Infinity;
    for (const [k, v] of this.cache.entries()) {
      if (v.ts < oldestTs) { oldestTs = v.ts; oldestKey = k; }
    }
    if (oldestKey) this.cache.delete(oldestKey);
  }

  async get(filePath) {
    const key = filePath;
    const now = Date.now();
    const entry = this.cache.get(key);
    if (entry) {
      // check TTL
      if (now - entry.ts < this.ttl) {
        return entry;
      }
      // attempt to stat to see if changed
      try {
        const stat = await fs.stat(filePath);
        if (stat.mtimeMs === entry.mtimeMs) {
          entry.ts = now; // refresh
          return entry;
        }
      } catch (e) {
        // file missing -> drop cache
        this.cache.delete(key);
        throw e;
      }
    }

    // read from disk and cache
    const obj = await this._read(filePath);
    const newEntry = { buffer: obj.buffer, mtimeMs: obj.mtimeMs, size: obj.size, type: obj.type, etag: obj.etag, lastModified: obj.lastModified, ts: now };
    this.cache.set(key, newEntry);
    this._pruneIfNeeded();
    return newEntry;
  }

  // Optional: clear cache or specific key
  del(filePath) { this.cache.delete(filePath); }
  clear() { this.cache.clear(); }
}

const instance = new FileCache();
instance.init().catch(e => console.error('[FileCache] init error:', e));
module.exports = instance;
