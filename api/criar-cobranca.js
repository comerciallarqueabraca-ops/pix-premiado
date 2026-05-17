export default async function handler(req, res) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { numeros, nome, telefone, email } = req.body;

  if (!numeros || !nome || !telefone || !email) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const quantidade = numeros.length;
  const total = quantidade * 500; // R$5,00 em centavos = 500

  const numerosStr = numeros.join(', ');

  try {
    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frequency: 'ONE_TIME',
        methods: ['PIX'],
        returnUrl: 'https://lojalarqueabraca.com.br/pix-premiado.html',
        completionUrl: `https://lojalarqueabraca.com.br/pagamento-confirmado.html?numeros=${numeros.join('-')}&nome=${encodeURIComponent(nome)}`,
        products: [
          {
            externalId: `pix-premiado-${numeros.join('-')}`,
            name: `Pix Premiado – Número${quantidade > 1 ? 's' : ''} ${numerosStr}`,
            description: `Participação no Pix Premiado Lar que Abraça. Número${quantidade > 1 ? 's' : ''}: ${numerosStr}`,
            quantity: quantidade,
            price: 500, // R$5,00 por número
          },
        ],
        customer: {
          name: nome,
          cellphone: telefone,
          email: email,
        },
        metadata: {
          numeros: numerosStr,
          total_reais: `R$ ${(total / 100).toFixed(2).replace('.', ',')}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('AbacatePay error:', data);
      return res.status(500).json({ error: data.error || 'Erro ao criar cobrança' });
    }

    // Retorna a URL de pagamento gerada
    return res.status(200).json({ url: data.data.url });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
