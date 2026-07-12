const { kv } = require('@vercel/kv');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Attempt to pull all collections from KV
    const users = await kv.get('purpes_erp_users');
    const catalog = await kv.get('purpes_erp_catalog');
    const orders = await kv.get('purpes_erp_orders');
    const counters = await kv.get('purpes_erp_slip_counters');
    
    res.status(200).json({
      users: users || null,
      catalog: catalog || null,
      orders: orders || null,
      counters: counters || null
    });
  } catch (error) {
    console.error('KV Sync Error:', error);
    res.status(500).json({ error: 'Failed to sync from database.' });
  }
}
