module.exports = async (req, res) => {
  const { applicationId, token } = req.query;

  if (!applicationId || !token) {
    return res.status(400).json({
      error: 'applicationId e token são necessários'
    });
  }

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