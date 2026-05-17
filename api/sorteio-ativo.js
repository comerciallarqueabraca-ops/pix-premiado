const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/sorteios?ativo=eq.true&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const data = await r.json();
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(200).json({ sorteio: null });
  }
  return res.status(200).json({ sorteio: data[0] });
}
