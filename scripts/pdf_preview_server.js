// api/scripts/pdf_preview_server.js
// Pequeno servidor para pré-visualizar a tabela do relatório PDF
// Útil para revisar mudanças visuais (coluna "Por") sem rodar o app.

const http = require('http');

const sampleRows = [
  {
    cdItem: '1001', nrPlaca: 'ABC-123', dsReduzida: 'Microcomputador',
    dsLocalizacao: 'TI', dsEstadoConser: 'Bom', dsSituacao: 'Em uso',
    statusBem: 'INVENTARIADO', inventariadoPor: 'João', vlAtual: 1520.75,
  },
  {
    cdItem: '1002', nrPlaca: 'DEF-456', dsReduzida: 'Impressora',
    dsLocalizacao: 'Administração', dsEstadoConser: 'Regular', dsSituacao: 'Em uso',
    statusBem: '', inventariadoPor: '', vlAtual: 620.00,
  },
];

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatCurrency(v) {
  if (v === null || v === undefined || isNaN(Number(v))) return '';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const rowsHtml = sampleRows.map((b, i) => `
  <tr>
    <td>${i + 1}</td>
    <td>${escapeHtml(b.cdItem)}</td>
    <td>${escapeHtml(b.nrPlaca)}</td>
    <td>${escapeHtml(b.dsReduzida)}</td>
    <td>${escapeHtml(b.dsLocalizacao)}</td>
    <td>${escapeHtml(b.dsEstadoConser)}</td>
    <td>${escapeHtml(b.dsSituacao)}</td>
    <td>${escapeHtml(b.statusBem || '')}</td>
    <td>${escapeHtml(b.inventariadoPor || '')}</td>
    <td style="text-align:right">${escapeHtml(formatCurrency(b.vlAtual))}</td>
  </tr>
`).join('');

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Prévia Relatório PDF</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; }
      thead th { background: #e6fffb; color: #065f5b; }
    </style>
  </head>
  <body>
    <h3>Pré-visualização da Tabela (com coluna "Por")</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Código</th>
          <th>Placa</th>
          <th>Descrição</th>
          <th>Localização</th>
          <th>Estado Conservação</th>
          <th>Situação</th>
          <th>Status</th>
          <th>Por</th>
          <th style="text-align:right">Valor Atual</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </body>
</html>`;

const wifiHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Prévia Ícones Wi‑Fi</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      .header { position: relative; height: 56px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; }
      .left { position: absolute; left: 12px; display: flex; align-items: center; }
      .title { font-weight: 600; color: #111; }
      .mdi { font-size: 24px; color: #38b2ac; }
      .spacer { height: 12px; }
    </style>
  </head>
  <body>
    <h3>Layout do Header: ícone à esquerda, título centralizado</h3>
    <div class="header">
      <div class="left"><span class="mdi mdi-wifi"></span></div>
      <div class="title">Leitura das Placas</div>
    </div>
    <div class="spacer"></div>
    <div class="header">
      <div class="left"><span class="mdi mdi-wifi-off"></span></div>
      <div class="title">Lista de Bens</div>
    </div>
    <p style="margin-top:16px;color:#444">O ícone fica alinhado à esquerda e o título permanece centralizado — exatamente como no app.</p>
  </body>
</html>`;

const principalHintHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Header Principal · Aviso de Assinatura</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      .header { position: relative; height: 56px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; }
      .left { position: absolute; left: 12px; display: flex; align-items: center; }
      .title { font-weight: 600; color: #111; }
      .hint { position: relative; text-align:center; color:#dc2626; font-size:12px; margin-top:6px; }
    </style>
  </head>
  <body>
    <h3>Header com Aviso (quando Trial expirado e sem assinatura)</h3>
    <div class="header">
      <div class="left"><span class="mdi mdi-wifi"></span></div>
      <div class="title">Leitura das Placas</div>
    </div>
    <div class="hint">Para acesso completo, faça uma assinatura.</div>

    <p style="margin-top:12px;color:#444">Este preview ilustra apenas o aspecto visual do texto sob o título. No app, ele só aparece quando o período de teste estiver expirado e não houver assinatura ativa.</p>
  </body>
</html>`;

const trialHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Configurações · Período de Teste</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      .header { position: relative; height: 56px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; }
      .left { position: absolute; left: 12px; display: flex; align-items: center; }
      .mdi { font-size: 22px; color: #38b2ac; }
      .title { font-weight: 600; color: #111; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; background: #fff; }
      .card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
      .card-title { font-weight: 700; color: #2c3e50; }
      .hint { color: #374151; margin-bottom: 8px; }
      .row { display:flex; align-items:center; }
      .row .mdi { font-size: 18px; margin-right: 6px; }
      .cta { margin-top: 12px; display: inline-block; background: #38b2ac; color: white; padding: 10px 16px; border-radius: 6px; text-decoration: none; }
    </style>
  </head>
  <body>
    <h3>Configurações</h3>
    <div class="header">
      <div class="left"><span class="mdi mdi-wifi"></span></div>
      <div class="title">Configurações</div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Período de Teste</div>
      </div>
      <div class="hint">Você está usando o período de teste gratuito.</div>
      <div class="row"><span class="mdi mdi-clock-outline"></span><span>Restante: 23 dias</span></div>
      <div class="hint">Expira em 20/12/2025</div>
      <a class="cta" href="#">Assinar agora</a>
    </div>

    <p style="color:#6b7280; margin-top:12px">Este preview ilustra o card de Trial na tela Configurações. Quando a assinatura estiver ativa, este card não será exibido.</p>
  </body>
</html>`;

const leituraHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Leitura · Estados do Botão Gravar</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      .footer { display:flex; gap:10px; position:relative; bottom:0; }
      .btn { padding: 10px 16px; border-radius: 6px; background:#111827; color:#fff; text-decoration:none; display:inline-block; }
      .btn.disabled { opacity: .5; pointer-events: none; }
      .card { border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin-top:14px; }
      .title { font-weight:700; margin-bottom:8px; }
      .hint { color:#374151; }
    </style>
  </head>
  <body>
    <h3>Leitura das Placas</h3>

    <div class="card">
      <div class="title">Durante Trial (bem localizado)</div>
      <div class="footer">
        <a class="btn" href="#">❌ Limpar</a>
        <a class="btn" href="#">🔍 Localizar</a>
        <a class="btn" href="#">💾 Gravar</a>
      </div>
      <div class="hint">Gravar fica ativo após localizar um bem, mesmo sem assinatura, enquanto o trial estiver vigente.</div>
    </div>

    <div class="card">
      <div class="title">Após Trial (sem assinatura)</div>
      <div class="footer">
        <a class="btn" href="#">❌ Limpar</a>
        <a class="btn" href="#">🔍 Localizar</a>
        <a class="btn disabled" href="#">💾 Gravar</a>
      </div>
      <div class="hint">Aplica regra original: Gravar desabilitado quando não há assinatura ativa.</div>
    </div>

    <div class="card">
      <div class="title">Após Trial (com assinatura)</div>
      <div class="footer">
        <a class="btn" href="#">❌ Limpar</a>
        <a class="btn" href="#">🔍 Localizar</a>
        <a class="btn" href="#">💾 Gravar</a>
      </div>
      <div class="hint">Com assinatura ativa, Gravar permanece habilitado conforme a lógica original.</div>
    </div>
  </body>
</html>`;

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  if (url.startsWith('/wifi')) {
    res.end(wifiHtml);
  } else if (url.startsWith('/trial')) {
    res.end(trialHtml);
  } else if (url.startsWith('/principal-hint')) {
    res.end(principalHintHtml);
  } else if (url.startsWith('/leitura')) {
    res.end(leituraHtml);
  } else {
    res.end(html);
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Prévia disponível em http://localhost:${PORT}/`);
  console.log(`Ícones Wi‑Fi: http://localhost:${PORT}/wifi`);
  console.log(`Fluxo Trial/Assinatura: http://localhost:${PORT}/trial`);
  console.log(`Header com aviso (principal): http://localhost:${PORT}/principal-hint`);
  console.log(`Estados do botão Gravar (Leitura): http://localhost:${PORT}/leitura`);
});