export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { numeros, nome, telefone, email, cpf } = req.body;

  if (!numeros || !nome || !telefone || !email) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const quantidade = numeros.length;
  const numerosStr = numeros.join(', ');
  const total = quantidade * 500;
  const headers = {
    'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    // Passo 1: criar cliente para pré-preencher o checkout
    const custResp = await fetch('https://api.abacatepay.com/v2/customers/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        name: nome,
        cellphone: telefone,
        ...(cpf && { taxId: cpf }),
      }),
    });
    const custData = await custResp.json();
    const customerId = custData.data?.id || null;

    // Passo 2: criar produto dinâmico para esta cobrança
    const prodResp = await fetch('https://api.abacatepay.com/v2/products/create', {
      method: 'POST',
      headers,
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

    // Passo 3: criar checkout com cliente e produto
    const checkBody = {
      items: [{ id: productId, quantity: quantidade }],
      methods: ['PIX'],
      returnUrl: 'https://www.lojalarqueabraca.com.br/pix-premiado.html',
      completionUrl: `https://www.lojalarqueabraca.com.br/pagamento-confirmado.html?numeros=${numeros.join('-')}&nome=${encodeURIComponent(nome)}`,
      metadata: {
        numeros: numerosStr,
        nome,
        telefone,
        email,
        total_reais: `R$ ${(total / 100).toFixed(2).replace('.', ',')}`,
      },
    };

    if (customerId) checkBody.customerId = customerId;

    const checkResp = await fetch('https://api.abacatepay.com/v2/checkouts/create', {
      method: 'POST',
      headers,
      body: JSON.stringify(checkBody),
    });

    const checkData = await checkResp.json();
    console.log('Checkout response:', JSON.stringify(checkData));

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
