const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const sbHeaders = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const event = req.body;
    if (event?.event !== 'checkout.completed') {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const metadata = event?.data?.checkout?.metadata || {};
    const { numeros, nome, telefone, email, total_reais } = metadata;
    const cpf = event?.data?.customer?.taxId || '';
    const checkout_id = event?.data?.checkout?.id || '';

    if (!numeros) return res.status(200).json({ ok: true, skipped: 'no metadata' });

    // Busca sorteio ativo
    const sorteioRes = await fetch(`${SUPABASE_URL}/rest/v1/sorteios?ativo=eq.true&limit=1`, {
      headers: sbHeaders,
    });
    const sorteios = await sorteioRes.json();
    if (!sorteios.length) return res.status(200).json({ ok: true, skipped: 'no sorteio ativo' });
    const sorteio_id = sorteios[0].id;

    // Salva participante
    const partRes = await fetch(`${SUPABASE_URL}/rest/v1/participantes`, {
      method: 'POST',
      headers: sbHeaders,
      body: JSON.stringify({ sorteio_id, numeros, nome, telefone, email, cpf, total_reais, checkout_id }),
    });
    const participantes = await partRes.json();
    const participante_id = participantes[0]?.id;

    // Salva números vendidos
    const nums = String(numeros).split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    for (const numero of nums) {
      await fetch(`${SUPABASE_URL}/rest/v1/numeros_vendidos`, {
        method: 'POST',
        headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ sorteio_id, numero, participante_id }),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({ ok: true });
  }
}
