// api/scripts/delete_user_everywhere.js
// Uso: node api/scripts/delete_user_everywhere.js <email>
// Remove usuário por email do SQLite do servidor e do Firebase (se configurado)

const path = require('path');
process.chdir(path.resolve(__dirname, '..'));

const { db } = require('../db/sqlite');
const Users = require('../repositories/userRepo');
const { auth: firebaseAuth, usingServiceAccount } = require('../config/firebase');

async function deleteFromFirebase(email) {
  if (!usingServiceAccount) {
    console.warn('[DeleteUser] Firebase admin não configurado; pulando remoção no Firebase.');
    return false;
  }
  try {
    const record = await firebaseAuth.getUserByEmail(email);
    if (record?.uid) {
      await firebaseAuth.deleteUser(record.uid);
      console.log(`[DeleteUser] Removido do Firebase: uid=${record.uid}`);
      return true;
    }
    console.log('[DeleteUser] Usuário não encontrado no Firebase.');
    return false;
  } catch (err) {
    console.warn('[DeleteUser] Erro ao remover no Firebase:', err?.message || err);
    return false;
  }
}

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error('Uso: node api/scripts/delete_user_everywhere.js <email>');
    process.exit(1);
  }
  console.log(`[DeleteUser] Iniciando remoção de: ${email}`);

  // Buscar usuário para obter id (ajuda a verificar existência)
  const user = Users.findByEmail(email);
  if (!user) {
    console.log('[DeleteUser] Usuário não encontrado no SQLite. Ainda assim, tentarei Firebase.');
  } else {
    console.log(`[DeleteUser] Encontrado no SQLite: id=${user.id}, tenantId=${user.tenantId || 'null'}`);
  }

  // Remover no Firebase (se possível)
  try {
    await deleteFromFirebase(email);
  } catch (e) {
    console.warn('[DeleteUser] Falha inesperada ao remover no Firebase (continuando):', e?.message || e);
  }

  // Remover no SQLite (por email)
  try {
    const ok = Users.deleteByEmail(email);
    if (ok) {
      console.log('[DeleteUser] Usuário removido do SQLite com sucesso.');
    } else {
      console.log('[DeleteUser] Nenhuma alteração no SQLite (usuário já inexistente).');
    }
  } catch (err) {
    console.error('[DeleteUser] Erro ao remover do SQLite:', err?.message || err);
    // Não falhar o processo para permitir diagnóstico no console
  }

  console.log('[DeleteUser] Processo concluído.');
}

main().catch(err => {
  console.error('[DeleteUser] Erro fatal:', err?.message || err);
  // Garantir saída controlada
  process.exit(0);
});