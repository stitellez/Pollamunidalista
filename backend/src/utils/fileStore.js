const { kv } = require('@vercel/kv');

// Same key names as the old JSON filenames so call sites stay unchanged —
// just store/retrieve a whole JSON document per key in Vercel KV (Redis).
const KEY_PREFIX = 'wmpredictor:';

async function readJSON(filename) {
  const data = await kv.get(KEY_PREFIX + filename);
  return data ?? null;
}

async function writeJSON(filename, data) {
  await kv.set(KEY_PREFIX + filename, data);
}

module.exports = { readJSON, writeJSON };
