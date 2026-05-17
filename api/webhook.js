const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxVyjxuu-wfJVsziHC71LP1J1dPP3J1eHWVtlGeN-oARVtTJPtoTJJ_pRf_PB5fPwR9/exec';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;

    // Só processa pagamentos confirmados
    if (event?.event !== 'BILLING.PAID' && event?.data?.status !== 'PAID') {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const metadata = event?.data?.metadata || {};
    const { numeros, nome, telefone, email, total_reais } = metadata;

    if (!numeros) {
      return res.status(200).json({ ok: true, skipped: 'no metadata' });
    }

    // Salva no Google Sheets
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeros, nome, telefone, email, total_reais }),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({ ok: true }); // sempre 200 para AbacatePay não retentar
  }
}
