// api/config/firebase.js
require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin SDK via variáveis de ambiente
// Opções suportadas:
// - FIREBASE_SERVICE_ACCOUNT_JSON: conteúdo JSON completo inline
// - FIREBASE_CREDENTIALS_PATH: caminho absoluto/relativo para o arquivo JSON
// - GOOGLE_APPLICATION_CREDENTIALS: caminho padrão suportado pelo SDK
let serviceAccount = null;

// Tentar ler conteúdo inline
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON inválido:', e.message);
  }
}

// Se não houver inline, tentar por caminho
if (!serviceAccount) {
  const credPath = process.env.FIREBASE_CREDENTIALS_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    try {
      const resolved = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
      const json = fs.readFileSync(resolved, 'utf8');
      serviceAccount = JSON.parse(json);
    } catch (e) {
      console.error('Erro ao ler credenciais do Firebase em', credPath, '-', e.message);
    }
  }
}

let firestoreAvailable = false;

if (!admin.apps.length) {
  try {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://coletoroficial-default-rtdb.firebaseio.com'
      });
      console.log('Firebase Admin SDK inicializado com credenciais do service account');
    } else {
      // Tentar credenciais padrão do ambiente
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://coletoroficial-default-rtdb.firebaseio.com'
      });
      console.log('Firebase Admin SDK inicializado com applicationDefault()');
    }
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin SDK:', error.message);
  }
}

const auth = admin.auth();
let firestore = null;

// Tentar inicializar Firestore com tratamento de erro
try {
  firestore = admin.firestore();
  
  // Configurar explicitamente as configurações do Firestore
  firestore.settings({
    ignoreUndefinedProperties: true,
    timestampsInSnapshots: true
  });
  console.log('Configurações do Firestore aplicadas com sucesso');
} catch (error) {
  console.warn('Firestore não pôde ser inicializado:', error.message);
  firestore = null;
}

// Testar/atualizar conexão com Firestore (rechecagem periódica)
async function refreshFirestoreAvailability() {
  if (!firestore) {
    // Tenta obter instância novamente, caso tenha falhado anteriormente
    try {
      firestore = admin.firestore();
    } catch (e) {
      console.warn('Tentativa de reobter instância do Firestore falhou:', e.message);
      firestoreAvailable = false;
      return false;
    }
  }

  try {
    const testRef = firestore.collection('_test');
    await testRef.limit(1).get();
    if (!firestoreAvailable) {
      console.log('Conexão com Firestore restaurada com sucesso');
    }
    firestoreAvailable = true;
    return true;
  } catch (error) {
    if (firestoreAvailable) {
      console.warn('Firestore perdeu disponibilidade:', error.message);
    } else {
      console.warn('Firestore não está disponível:', error.message);
    }
    firestoreAvailable = false;
    return false;
  }
}

// Executar teste de conexão na inicialização e revalidar periodicamente
refreshFirestoreAvailability();
setInterval(refreshFirestoreAvailability, 60000); // rechecagem a cada 60s

// Função helper para verificar se Firestore está disponível
function isFirestoreAvailable() {
  return firestoreAvailable && firestore !== null;
}

module.exports = {
  admin,
  auth,
  firestore,
  isFirestoreAvailable,
  refreshFirestoreAvailability
};