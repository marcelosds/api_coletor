// api/scripts/checkInventariadoPor.js
// Uso: node api/scripts/checkInventariadoPor.js <codigo_ou_placa> [--nr=<nrInventario>]

const path = require('path');
const { db } = require('../db/sqlite');
const inventoryRepo = require('../repositories/inventoryRepo');

function parseArgs() {
  const args = process.argv.slice(2);
  if (!args.length) return { code: null, nrInventario: null };
  const code = args[0];
  let nrInventario = null;
  for (const a of args.slice(1)) {
    const m = a.match(/^--(?:nr|inventario)=(.+)$/);
    if (m) nrInventario = m[1];
  }
  return { code, nrInventario };
}

async function main() {
  const { code, nrInventario } = parseArgs();
  if (!code) {
    console.error('Uso: node api/scripts/checkInventariadoPor.js <codigo_ou_placa> [--nr=<nrInventario>]');
    process.exitCode = 1;
    return;
  }

  try {
    // Verificar conexão básica
    if (!db) {
      console.error('Falha ao abrir banco SQLite.');
      process.exitCode = 2;
      return;
    }

    const item = inventoryRepo.getByCode(code, nrInventario);
    if (!item) {
      // Fallback: tentativa de localizar parcialmente por codigo/placa contendo o valor
      const rows = db.prepare(`
        SELECT * FROM inventory
        WHERE (codigo = ? OR placa = ? OR placa LIKE ? OR codigo LIKE ?)
        ${nrInventario ? ' AND nrInventario = ?' : ''}
        ORDER BY updatedAt DESC
        LIMIT 10
      `).all(
        code,
        code,
        `%${code}%`,
        `%${code}%`,
        ...(nrInventario ? [nrInventario] : [])
      );
      if (!rows || rows.length === 0) {
        console.log(JSON.stringify({
          found: false,
          code,
          nrInventario: nrInventario || null,
          message: 'Item não encontrado no banco local.'
        }, null, 2));
        return;
      }
      const mapped = rows.map(r => ({
        id: r.id,
        codigo: r.codigo,
        placa: r.placa,
        nrInventario: r.nrInventario,
        inventariadoPor: r.inventariadoPor || null,
        statusBem: r.statusBem || null,
        descricao: r.descricao || null,
        localizacaoNome: r.localizacaoNome || null,
        situacaoNome: r.situacaoNome || null,
        estadoConservacaoNome: r.estadoConservacaoNome || null,
        updatedAt: r.updatedAt || null,
        createdAt: r.createdAt || null
      }));
      console.log(JSON.stringify({
        found: true,
        code,
        nrInventario: nrInventario || null,
        partialMatches: mapped
      }, null, 2));
      return;
    }

    console.log(JSON.stringify({
      found: true,
      id: item.id,
      codigo: item.codigo,
      placa: item.placa,
      nrInventario: item.nrInventario,
      inventariadoPor: item.inventariadoPor || null,
      statusBem: item.statusBem || null,
      descricao: item.descricao || null,
      localizacaoNome: item.localizacaoNome || null,
      situacaoNome: item.situacaoNome || null,
      estadoConservacaoNome: item.estadoConservacaoNome || null,
      updatedAt: item.updatedAt || null,
      createdAt: item.createdAt || null
    }, null, 2));
  } catch (err) {
    console.error('Erro ao consultar item:', err?.message || err);
    process.exitCode = 3;
  }
}

main();