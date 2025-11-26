// api/repositories/userRepo.js
const { db, nowISO } = require('../db/sqlite');

function createUser({ email, password, name, tenantId }) {
  try {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    const ts = nowISO();
    console.log('[UserRepo] Criando usuário:', { id, email, name });
    
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, tenantId, createdAt, updatedAt)
      VALUES (?,?,?,?,?,?,?)
    `);
    const result = stmt.run(id, email, password, name || null, tenantId || null, ts, ts);
    
    console.log('[UserRepo] Usuário criado com sucesso:', { id, changes: result.changes });
    return { id, email, name, tenantId: tenantId || null, createdAt: ts };
  } catch (error) {
    console.error('[UserRepo] Erro ao criar usuário:', error);
    throw error;
  }
}

function findByEmail(email) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  return row || null;
}

function getById(id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return row || null;
}

function deleteById(id) {
  try {
    const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return res.changes > 0;
  } catch (error) {
    console.error('[UserRepo] Erro ao deletar usuário por id:', error);
    throw error;
  }
}

function deleteByEmail(email) {
  try {
    const res = db.prepare('DELETE FROM users WHERE email = ?').run(email);
    return res.changes > 0;
  } catch (error) {
    console.error('[UserRepo] Erro ao deletar usuário por email:', error);
    throw error;
  }
}

// Atualiza o nome do usuário por ID
function updateNameById(id, name) {
  try {
    const ts = nowISO();
    const res = db.prepare('UPDATE users SET name = ?, updatedAt = ? WHERE id = ?').run(name, ts, id);
    if (res.changes > 0) {
      return getById(id);
    }
    return null;
  } catch (error) {
    console.error('[UserRepo] Erro ao atualizar nome por id:', error);
    throw error;
  }
}

// Atualiza o nome do usuário por email
function updateNameByEmail(email, name) {
  try {
    const ts = nowISO();
    const res = db.prepare('UPDATE users SET name = ?, updatedAt = ? WHERE email = ?').run(name, ts, email);
    if (res.changes > 0) {
      return findByEmail(email);
    }
    return null;
  } catch (error) {
    console.error('[UserRepo] Erro ao atualizar nome por email:', error);
    throw error;
  }
}

function updateTenantIdByEmail(email, tenantId) {
  try {
    const ts = nowISO();
    const res = db.prepare('UPDATE users SET tenantId = ?, updatedAt = ? WHERE email = ?').run(tenantId, ts, email);
    if (res.changes > 0) {
      return findByEmail(email);
    }
    return null;
  } catch (error) {
    console.error('[UserRepo] Erro ao atualizar tenantId por email:', error);
    throw error;
  }
}

// Atualiza a senha (hash bcrypt) do usuário por email
function updatePasswordByEmail(email, hashedPassword) {
  try {
    const ts = nowISO();
    const res = db.prepare('UPDATE users SET password = ?, updatedAt = ? WHERE email = ?').run(hashedPassword, ts, email);
    if (res.changes > 0) {
      return findByEmail(email);
    }
    return null;
  } catch (error) {
    console.error('[UserRepo] Erro ao atualizar senha por email:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  findByEmail,
  getById,
  deleteById,
  deleteByEmail,
  updateNameById,
  updateNameByEmail,
  updateTenantIdByEmail,
  updatePasswordByEmail,
};