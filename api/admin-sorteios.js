const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function sb(path, method = 'GET', body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers, 'Prefer': method === 'POST' ? 'return=representation' : '' },
    body: body ? JSON.stringify(body) : null,
  });
  return res.json();
}

export default async function handler(req, res) {
  // Verifica autenticação via Bearer token do Supabase
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  // Valida token com Supabase
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${token}` },
  });
  if (!userRes.ok) return res.status(401).json({ error: 'Token inválido' });

  if (req.method === 'GET') {
    const data = await sb('sorteios?select=*,participantes(count)&order=created_at.desc');
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { titulo, descricao, quantidade_numeros, preco_centavos, data_sorteio } = req.body;
    // Desativa sorteios anteriores
    await sb('sorteios?ativo=eq.true', 'PATCH', { ativo: false });
    const data = await sb('sorteios', 'POST', {
      titulo, descricao,
      quantidade_numeros: quantidade_numeros || 30,
      preco_centavos: preco_centavos || 500,
      data_sorteio: data_sorteio || null,
      ativo: true,
    });
    return res.status(200).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, ...fields } = req.body;
    const data = await sb(`sorteios?id=eq.${id}`, 'PATCH', fields);
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
