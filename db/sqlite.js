// api/db/sqlite.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config/config');

let db = null;
let dbAvailable = false;

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function init() {
  try {
    const dbPath = path.resolve(process.cwd(), config.database.path);
    ensureDirExists(dbPath);
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Criar tabelas se não existirem
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        codigo TEXT,
        placa TEXT,
        descricao TEXT,
        localizacaoNome TEXT,
        situacaoNome TEXT,
        estadoConservacaoNome TEXT,
        dsObservacao TEXT,
        codigoLocalizacao TEXT,
        codigoSituacao TEXT,
        codigoEstado TEXT,
        nrInventario TEXT,
        valorAtual REAL,
        statusBem TEXT,
        inventariadoPor TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_inventory_userId ON inventory (userId);
      CREATE INDEX IF NOT EXISTS idx_inventory_updatedAt ON inventory (updatedAt);
      CREATE INDEX IF NOT EXISTS idx_inventory_codigo ON inventory (codigo);
      CREATE INDEX IF NOT EXISTS idx_inventory_placa ON inventory (placa);
    `);

    dbAvailable = true;
    // Migration: ensure column inventariadoPor exists
    try {
      const cols = db.prepare("PRAGMA table_info('inventory')").all();
      const hasInventariadoPor = Array.isArray(cols) && cols.some(c => c.name === 'inventariadoPor');
      if (!hasInventariadoPor) {
        db.prepare('ALTER TABLE inventory ADD COLUMN inventariadoPor TEXT').run();
      }
    } catch (migErr) {
      console.warn('SQLite migration warning (inventariadoPor):', migErr?.message || migErr);
    }
  } catch (e) {
    console.error('Erro ao inicializar SQLite:', e?.message || e);
    dbAvailable = false;
  }
}

function isDbAvailable() {
  return !!db && dbAvailable;
}

function nowISO() {
  return new Date().toISOString();
}

init();

module.exports = {
  db,
  isDbAvailable,
  nowISO,
};