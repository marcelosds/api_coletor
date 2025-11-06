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

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Prévia disponível em http://localhost:${PORT}/`);
});