const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${token}` },
  });
  if (!userRes.ok) return res.status(401).json({ error: 'Token inválido' });

  const { sorteio_id } = req.query;
  const filter = sorteio_id ? `&sorteio_id=eq.${sorteio_id}` : '';

  const data = await fetch(`${SUPABASE_URL}/rest/v1/participantes?select=*&order=created_at.desc${filter}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  }).then(r => r.json());

  return res.status(200).json(data);
}
