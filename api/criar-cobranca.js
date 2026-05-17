export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { numeros, nome, telefone, email } = req.body;

  if (!numeros || !nome || !telefone || !email) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const quantidade = numeros.length;
  const numerosStr = numeros.join(', ');
  const total = quantidade * 500; // R$5,00 em centavos

  try {
    // Passo 1: criar produto dinâmico para esta cobrança
    const prodResp = await fetch('https://api.abacatepay.com/v2/products/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Pix Premiado – Nº ${numerosStr}`,
        description: `Participação no Pix Premiado Lar que Abraça. Números: ${numerosStr}`,
        price: 500,
        currency: 'BRL',
        externalId: `pix-premiado-${Date.now()}`,
      }),
    });

    const prodData = await prodResp.json();

    if (!prodResp.ok || prodData.error) {
      console.error('Produto error:', prodData);
      return res.status(500).json({ error: prodData.error || 'Erro ao criar produto' });
    }

    const productId = prodData.data.id;

    // Passo 2: criar checkout com o produto
    const checkResp = await fetch('https://api.abacatepay.com/v2/checkouts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ id: productId, quantity: quantidade }],
        methods: ['PIX'],
        returnUrl: 'https://lojalarqueabraca.com.br/pix-premiado.html',
        completionUrl: `https://lojalarqueabraca.com.br/pagamento-confirmado.html?numeros=${numeros.join('-')}&nome=${encodeURIComponent(nome)}`,
        metadata: {
          numeros: numerosStr,
          nome,
          telefone,
          email,
          total_reais: `R$ ${(total / 100).toFixed(2).replace('.', ',')}`,
        },
      }),
    });

    const checkData = await checkResp.json();

    if (!checkResp.ok || checkData.error) {
      console.error('Checkout error:', checkData);
      return res.status(500).json({ error: checkData.error || 'Erro ao criar checkout' });
    }

    return res.status(200).json({ url: checkData.data.url });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
