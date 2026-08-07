const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Objeto na memoria para guardar os links
const dbLinks = {};

app.use(express.json());

// Serve o arquivo index.html direto da raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para encurtar
app.post('/api/shorten', (req, res) => {
  const { url, customCode } = req.body;
  if (!url) return res.status(400).json({ error: 'URL e obrigatoria.' });

  // Gera um codigo aleatorio se nao mandar personalizado
  const code = customCode && customCode.trim() !== '' 
    ? customCode.trim() 
    : Math.random().toString(36).substring(2, 8);

  if (dbLinks[code]) {
    return res.status(400).json({ error: 'Este apelido ja esta em uso.' });
  }

  dbLinks[code] = url;

  const shortUrl = `${req.protocol}://${req.get('host')}/${code}`;
  res.json({ shortUrl, code });
});

// Rota de redirecionamento direto
app.get('/:code', (req, res) => {
  const { code } = req.params;
  const originalUrl = dbLinks[code];

  if (originalUrl) {
    return res.redirect(302, originalUrl);
  }

  res.status(404).send('<h1>Link nao encontrado!</h1>');
});

app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
