// api/config/firebase.js
const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin SDK
const serviceAccount = require('./coletoroficial-firebase-adminsdk-fbsvc-b4c3260d39.json');

let firestoreAvailable = false;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: "https://coletoroficial-default-rtdb.firebaseio.com"
    });
    console.log('Firebase Admin SDK inicializado com sucesso');
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