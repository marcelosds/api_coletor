// api/repositories/userRepo.js
const { db, nowISO } = require('../db/sqlite');

function createUser({ email, password, name }) {
  try {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    const ts = nowISO();
    console.log('[UserRepo] Criando usuário:', { id, email, name });
    
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, createdAt, updatedAt)
      VALUES (?,?,?,?,?,?)
    `);
    const result = stmt.run(id, email, password, name || null, ts, ts);
    
    console.log('[UserRepo] Usuário criado com sucesso:', { id, changes: result.changes });
    return { id, email, name, createdAt: ts };
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

module.exports = {
  createUser,
  findByEmail,
  getById,
  deleteById,
  deleteByEmail,
};