const { Redis } = require('@upstash/redis');
const kv = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { key, data } = req.body;
  if (!key || data === undefined) {
    return res.status(400).json({ error: 'Missing key or data' });
  }

  try {
    // Save to Vercel KV
    await kv.set(key, data);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('KV Push Error:', error);
    res.status(500).json({ error: 'Failed to push to database.' });
  }
}
