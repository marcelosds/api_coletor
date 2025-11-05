// api/repositories/inventoryRepo.js
const { db, nowISO } = require('../db/sqlite');

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toCanonicalRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    codigo: row.codigo || null,
    placa: row.placa || null,
    descricao: row.descricao || null,
    localizacaoNome: row.localizacaoNome || null,
    situacaoNome: row.situacaoNome || null,
    estadoConservacaoNome: row.estadoConservacaoNome || null,
    dsObservacao: row.dsObservacao || null,
    codigoLocalizacao: row.codigoLocalizacao || null,
    codigoSituacao: row.codigoSituacao || null,
    codigoEstado: row.codigoEstado || null,
    nrInventario: row.nrInventario || null,
    valorAtual: row.valorAtual !== null && row.valorAtual !== undefined ? Number(row.valorAtual) : null,
    StatusBem: row.statusBem || null,
    statusBem: row.statusBem || null,
    status: row.statusBem || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

function list({ nrInventario, page = 1, limit = 50, q, field, since }) {
  const offset = (page - 1) * limit;
  let where = '1=1';
  const params = [];

  if (nrInventario) {
    where += ' AND nrInventario = ?';
    params.push(nrInventario);
  }
  if (since) {
    where += ' AND updatedAt >= ?';
    params.push(since);
  }
  // Mapear alias 'local' para 'localizacaoNome' por compatibilidade
  const searchField = field === 'local' ? 'localizacaoNome' : field;
  if (q && searchField && ['codigo','placa','descricao','localizacaoNome'].includes(searchField)) {
    where += ` AND ${searchField} LIKE ?`;
    params.push(`${q}%`);
  }

  const rows = db.prepare(`
    SELECT * FROM inventory WHERE ${where}
    ORDER BY updatedAt DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`SELECT COUNT(*) as c FROM inventory WHERE ${where}`).get(...params).c;
  return {
    items: rows.map(toCanonicalRow),
    total,
    totalPages: Math.ceil(total / limit),
    page,
    limit,
  };
}

function getById(id, nrInventario) {
  let sql = 'SELECT * FROM inventory WHERE id = ?';
  const params = [id];
  if (nrInventario) {
    sql += ' AND nrInventario = ?';
    params.push(nrInventario);
  }
  const row = db.prepare(sql).get(...params);
  return toCanonicalRow(row);
}

function getByCode(code, nrInventario) {
  let row = null;
  if (nrInventario) {
    row = db.prepare('SELECT * FROM inventory WHERE nrInventario = ? AND codigo = ?').get(nrInventario, code);
    if (!row) {
      row = db.prepare('SELECT * FROM inventory WHERE nrInventario = ? AND placa = ?').get(nrInventario, code);
    }
  } else {
    row = db.prepare('SELECT * FROM inventory WHERE codigo = ?').get(code);
    if (!row) {
      row = db.prepare('SELECT * FROM inventory WHERE placa = ?').get(code);
    }
  }
  return toCanonicalRow(row);
}

function create(data, userId) {
  const id = genId();
  const ts = nowISO();
  db.prepare(`
    INSERT INTO inventory (
      id, userId, codigo, placa, descricao,
      localizacaoNome, situacaoNome, estadoConservacaoNome, dsObservacao,
      codigoLocalizacao, codigoSituacao, codigoEstado,
      nrInventario, valorAtual, statusBem,
      createdAt, updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, userId, data.codigo || null, data.placa || null, data.descricao || null,
    data.localizacaoNome || null, data.situacaoNome || null, data.estadoConservacaoNome || null, data.dsObservacao || null,
    data.codigoLocalizacao || null, data.codigoSituacao || null, data.codigoEstado || null,
    data.nrInventario || null, data.valorAtual ?? null, data.statusBem || null,
    ts, ts
  );
  const row = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
  return toCanonicalRow(row);
}

function updateById(id, data) {
  const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
  if (!existing) return null;
  const statusBem = existing.statusBem || '';
  if (statusBem && String(statusBem).trim().startsWith('Bem Inventariado')) {
    return { skipped: true, item: toCanonicalRow(existing) };
  }

  const ts = nowISO();
  db.prepare(`
    UPDATE inventory SET
      codigo = COALESCE(?, codigo),
      placa = COALESCE(?, placa),
      descricao = COALESCE(?, descricao),
      localizacaoNome = COALESCE(?, localizacaoNome),
      situacaoNome = COALESCE(?, situacaoNome),
      estadoConservacaoNome = COALESCE(?, estadoConservacaoNome),
      dsObservacao = COALESCE(?, dsObservacao),
      codigoLocalizacao = COALESCE(?, codigoLocalizacao),
      codigoSituacao = COALESCE(?, codigoSituacao),
      codigoEstado = COALESCE(?, codigoEstado),
      nrInventario = COALESCE(?, nrInventario),
      valorAtual = COALESCE(?, valorAtual),
      statusBem = COALESCE(?, statusBem),
      updatedAt = ?
    WHERE id = ?
  `).run(
    data.codigo ?? null, data.placa ?? null, data.descricao ?? null,
    data.localizacaoNome ?? null, data.situacaoNome ?? null, data.estadoConservacaoNome ?? null, data.dsObservacao ?? null,
    data.codigoLocalizacao ?? null, data.codigoSituacao ?? null, data.codigoEstado ?? null,
    data.nrInventario ?? null, data.valorAtual ?? null, data.statusBem ?? null,
    ts, id
  );
  const row = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
  return { skipped: false, item: toCanonicalRow(row) };
}

function deleteById(id) {
  const res = db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
  return res.changes > 0;
}

function deleteByInventario(nrInventario) {
  if (!nrInventario) return 0;
  const res = db.prepare('DELETE FROM inventory WHERE nrInventario = ?').run(nrInventario);
  return res.changes || 0;
}

function deleteByUserId(userId) {
  try {
    const res = db.prepare('DELETE FROM inventory WHERE userId = ?').run(userId);
    return res.changes || 0;
  } catch (error) {
    console.error('[InventoryRepo] Erro ao deletar inventários por userId:', error);
    throw error;
  }
}

function updateByCode(code, data, nrInventario) {
  const row = getByCode(code, nrInventario);
  if (!row) return null;
  return updateById(row.id, data);
}

function distinctLocais(nrInventario) {
  let sql = `
    SELECT DISTINCT
      COALESCE(codigoLocalizacao, NULL) AS codigo,
      COALESCE(localizacaoNome, localizacaoNome) AS nome
    FROM inventory
    WHERE localizacaoNome IS NOT NULL
  `;
  const params = [];
  if (nrInventario) {
    sql += ' AND nrInventario = ?';
    params.push(nrInventario);
  }
  const rows = db.prepare(sql).all(...params);
  return rows.map(r => ({ codigo: r.codigo || null, nome: r.nome })).filter(r => r && r.nome);
}

function distinctSituacoes(nrInventario) {
  let sql = `
    SELECT DISTINCT
      COALESCE(codigoSituacao, NULL) AS codigo,
      COALESCE(situacaoNome, situacaoNome) AS nome
    FROM inventory
    WHERE situacaoNome IS NOT NULL
  `;
  const params = [];
  if (nrInventario) {
    sql += ' AND nrInventario = ?';
    params.push(nrInventario);
  }
  const rows = db.prepare(sql).all(...params);
  return rows.map(r => ({ codigo: r.codigo || null, nome: r.nome }));
}

function distinctEstados(nrInventario) {
  let sql = `
    SELECT DISTINCT
      COALESCE(codigoEstado, NULL) AS codigo,
      COALESCE(estadoConservacaoNome, estadoConservacaoNome) AS nome
    FROM inventory
    WHERE estadoConservacaoNome IS NOT NULL
  `;
  const params = [];
  if (nrInventario) {
    sql += ' AND nrInventario = ?';
    params.push(nrInventario);
  }
  const rows = db.prepare(sql).all(...params);
  return rows.map(r => ({ codigo: r.codigo || null, nome: r.nome }));
}

function sync(items = [], userId) {
  const results = [];
  const insert = db.prepare(`
    INSERT INTO inventory (
      id, userId, codigo, placa, descricao,
      localizacaoNome, situacaoNome, estadoConservacaoNome, dsObservacao,
      codigoLocalizacao, codigoSituacao, codigoEstado,
      nrInventario, valorAtual, statusBem,
      createdAt, updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const update = db.prepare(`
    UPDATE inventory SET
      codigo = ?, placa = ?, descricao = ?,
      localizacaoNome = ?, situacaoNome = ?, estadoConservacaoNome = ?, dsObservacao = ?,
      codigoLocalizacao = ?, codigoSituacao = ?, codigoEstado = ?,
      nrInventario = ?, valorAtual = ?, statusBem = ?,
      updatedAt = ?
    WHERE id = ?
  `);
  const selectById = db.prepare('SELECT * FROM inventory WHERE id = ?');
  const selectByCodigoWithInv = db.prepare('SELECT * FROM inventory WHERE nrInventario = ? AND codigo = ?');
  const selectByCodigoGlobal = db.prepare('SELECT * FROM inventory WHERE codigo = ?');
  const selectByPlacaWithInv = db.prepare('SELECT * FROM inventory WHERE nrInventario = ? AND placa = ?');
  const selectByPlacaGlobal = db.prepare('SELECT * FROM inventory WHERE placa = ?');

  items.forEach(item => {
    const ts = nowISO();
    let existing = null;
    if (item.id) existing = selectById.get(item.id);
    if (!existing && item.codigo) {
      existing = item.nrInventario ? selectByCodigoWithInv.get(item.nrInventario, item.codigo) : selectByCodigoGlobal.get(item.codigo);
    }
    if (!existing && item.placa) {
      existing = item.nrInventario ? selectByPlacaWithInv.get(item.nrInventario, item.placa) : selectByPlacaGlobal.get(item.placa);
    }

    if (existing) {
      const statusBem = existing.statusBem || '';
      if (statusBem && String(statusBem).trim().startsWith('Bem Inventariado')) {
        results.push({ id: existing.id, action: 'skipped' });
      } else {
        update.run(
          item.codigo ?? existing.codigo,
          item.placa ?? existing.placa,
          item.descricao ?? existing.descricao,
          item.localizacaoNome ?? existing.localizacaoNome,
          item.situacaoNome ?? existing.situacaoNome,
          item.estadoConservacaoNome ?? existing.estadoConservacaoNome,
          item.dsObservacao ?? existing.dsObservacao,
          item.codigoLocalizacao ?? existing.codigoLocalizacao,
          item.codigoSituacao ?? existing.codigoSituacao,
          item.codigoEstado ?? existing.codigoEstado,
          item.nrInventario ?? existing.nrInventario,
          item.valorAtual ?? existing.valorAtual,
          item.statusBem ?? existing.statusBem,
          ts,
          existing.id
        );
        results.push({ id: existing.id, action: 'updated' });
      }
    } else {
      const id = item.id || genId();
      insert.run(
        id, userId,
        item.codigo ?? null,
        item.placa ?? null,
        item.descricao ?? null,
        item.localizacaoNome ?? null,
        item.situacaoNome ?? null,
        item.estadoConservacaoNome ?? null,
        item.dsObservacao ?? null,
        item.codigoLocalizacao ?? null,
        item.codigoSituacao ?? null,
        item.codigoEstado ?? null,
        item.nrInventario ?? null,
        item.valorAtual ?? null,
        item.statusBem ?? null,
        ts, ts
      );
      results.push({ id, action: 'created' });
    }
  });

  return results;
}

module.exports = {
  list,
  getById,
  getByCode,
  create,
  updateById,
  updateByCode,
  deleteById,
  deleteByInventario,
  deleteByUserId,
  distinctLocais,
  distinctSituacoes,
  distinctEstados,
  sync,
};