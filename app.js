const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { customAlphabet } = require('nanoid');

const app = express();
const PORT = 3000;
const generateCode = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

// Banco de dados em arquivo unico local (cria sozinho)
const db = new sqlite3.Database('./links.db');
db.run(`
  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL
  )
`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROTA 1: A Pagina HTML do Site (Tudo embutido aqui)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Encurtador de Links Simples</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      <style>
        body { font-family: sans-serif; background: #0f172a; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 30px; border-radius: 12px; width: 100%; max-width: 400px; text-align: center; }
        input { width: 100%; padding: 10px; margin: 8px 0; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #fff; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 8px; }
        .result { margin-top: 20px; padding-top: 15px; border-top: 1px solid #334155; display: none; }
        #qrcode { display: flex; justify-content: center; margin-top: 10px; background: white; padding: 10px; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Encurtador de Links</h2>
        <input type="url" id="url" placeholder="Cole sua URL longa aqui" />
        <button onclick="encurtar()">Encurtar Link</button>

        <div id="result" class="result">
          <p>Seu link encurtado:</p>
          <input type="text" id="shortUrl" readonly />
          <button onclick="copiar()">Copiar Link</button>
          <div id="qrcode"></div>
        </div>
      </div>

      <script>
        async function encurtar() {
          const url = document.getElementById('url').value;
          if (!url) return alert('Digite uma URL!');

          const res = await fetch('/encurtar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          const data = await res.json();

          document.getElementById('shortUrl').value = data.shortUrl;
          document.getElementById('result').style.display = 'block';

          document.getElementById('qrcode').innerHTML = '';
          new QRCode(document.getElementById('qrcode'), { text: data.shortUrl, width: 120, height: 120 });
        }

        function copiar() {
          const copyText = document.getElementById('shortUrl');
          copyText.select();
          navigator.clipboard.writeText(copyText.value);
          alert('Copiado!');
        }
      </script>
    </body>
    </html>
  `);
});

// ROTA 2: Criar o link encurtado
app.post('/encurtar', (req, res) => {
  const { url } = req.body;
  const code = generateCode();

  db.run(`INSERT INTO links (code, original_url) VALUES (?, ?)`, [code, url], function (err) {
    if (err) return res.status(500).json({ error: 'Erro no banco' });
    const shortUrl = `${req.protocol}://${req.get('host')}/${code}`;
    res.json({ shortUrl });
  });
});

// ROTA 3: Redirecionar quando alguem clicar no link curto
app.get('/:code', (req, res) => {
  const { code } = req.params;
  db.get(`SELECT original_url FROM links WHERE code = ?`, [code], (err, row) => {
    if (row) {
      res.redirect(row.original_url);
    } else {
      res.status(404).send('Link nao encontrado.');
    }
  });
});

app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
      
