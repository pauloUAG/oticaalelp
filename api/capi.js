// Função serverless do Vercel: recebe o evento de conversão do navegador e repassa
// pro Meta via Conversions API (lado do servidor), com o token escondido.
// O token vem da variável de ambiente META_CAPI_TOKEN, configurada no painel do Vercel
// (Project Settings > Environment Variables) — nunca fica escrito no código.

const PIXEL_ID = '2496898027781817';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'método não permitido' });
    return;
  }

  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    res.status(500).json({ erro: 'META_CAPI_TOKEN não configurado no Vercel' });
    return;
  }

  const corpo = req.body || {};
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: corpo.eventId,
      event_source_url: corpo.url,
      action_source: 'website',
      user_data: {
        client_ip_address: ip || undefined,
        client_user_agent: req.headers['user-agent'],
        fbp: corpo.fbp || undefined,
        fbc: corpo.fbc || undefined
      }
    }]
  };

  try {
    const resposta = await fetch(
      'https://graph.facebook.com/v19.0/' + PIXEL_ID + '/events?access_token=' + token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    const dados = await resposta.json();
    res.status(resposta.ok ? 200 : 502).json(dados);
  } catch (erro) {
    res.status(500).json({ erro: String(erro) });
  }
};
