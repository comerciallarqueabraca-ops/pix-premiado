const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const baseHeaders = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function sb(path, method = 'GET', body = null, prefer = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...baseHeaders, ...(prefer ? { 'Prefer': prefer } : {}) },
    body: body ? JSON.stringify(body) : null,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${token}` },
  });
  if (!userRes.ok) return res.status(401).json({ error: 'Token inválido' });

  if (req.method === 'GET') {
    const data = await sb('sorteios?select=*&order=created_at.desc');
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { titulo, descricao, quantidade_numeros, preco_centavos, data_sorteio } = req.body;
    if (!titulo) return res.status(400).json({ error: 'Título obrigatório' });

    // Desativa sorteios anteriores
    await sb('sorteios?ativo=eq.true', 'PATCH', { ativo: false }, 'return=minimal');

    // Cria novo sorteio
    const data = await sb('sorteios', 'POST', {
      titulo,
      descricao: descricao || null,
      quantidade_numeros: quantidade_numeros || 30,
      preco_centavos: preco_centavos || 500,
      data_sorteio: data_sorteio || null,
      ativo: true,
    }, 'return=representation');

    return res.status(200).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    const data = await sb(`sorteios?id=eq.${id}`, 'PATCH', fields, 'return=representation');
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
