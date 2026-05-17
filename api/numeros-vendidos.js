const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    // Busca sorteio ativo
    const sorteioRes = await fetch(`${SUPABASE_URL}/rest/v1/sorteios?ativo=eq.true&limit=1`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const sorteios = await sorteioRes.json();
    if (!sorteios.length) return res.status(200).json({ numeros: [], sorteio: null });

    const sorteio = sorteios[0];

    // Busca números vendidos
    const numsRes = await fetch(`${SUPABASE_URL}/rest/v1/numeros_vendidos?sorteio_id=eq.${sorteio.id}&select=numero`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const nums = await numsRes.json();

    return res.status(200).json({
      numeros: nums.map(n => n.numero),
      sorteio: {
        id: sorteio.id,
        titulo: sorteio.titulo,
        descricao: sorteio.descricao,
        quantidade_numeros: sorteio.quantidade_numeros,
        preco_centavos: sorteio.preco_centavos,
        data_sorteio: sorteio.data_sorteio,
      }
    });
  } catch (e) {
    return res.status(200).json({ numeros: [], sorteio: null });
  }
}
