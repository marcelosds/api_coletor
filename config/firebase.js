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
let usingServiceAccount = false;

function normalizePrivateKey(key) {
  if (!key || typeof key !== 'string') return key;
  // Corrigir chaves com \n vindas de env
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

function isValidServiceAccount(json) {
  if (!json || typeof json !== 'object') return false;
  const required = ['type', 'project_id', 'client_email', 'private_key'];
  const ok = required.every(k => json[k] && String(json[k]).trim() !== '');
  if (!ok) return false;
  if (json.type !== 'service_account') return false;
  const pk = normalizePrivateKey(json.private_key);
  return pk && pk.includes('BEGIN PRIVATE KEY');
}

// Tentar ler conteúdo inline
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const raw = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    // Normalizar private_key vinda de env
    if (raw && raw.private_key) raw.private_key = normalizePrivateKey(raw.private_key);
    if (isValidServiceAccount(raw)) {
      serviceAccount = raw;
      usingServiceAccount = true;
      console.log('Firebase: credenciais carregadas de FIREBASE_SERVICE_ACCOUNT_JSON');
    } else {
      console.error('Firebase: JSON de service account inválido ou incompleto em FIREBASE_SERVICE_ACCOUNT_JSON');
    }
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
      const raw = JSON.parse(json);
      if (raw && raw.private_key) raw.private_key = normalizePrivateKey(raw.private_key);
      if (isValidServiceAccount(raw)) {
        serviceAccount = raw;
        usingServiceAccount = true;
        console.log('Firebase: credenciais carregadas de', resolved);
      } else {
        console.error('Firebase: arquivo de credenciais inválido ou incompleto em', resolved);
      }
    } catch (e) {
      console.error('Erro ao ler credenciais do Firebase em', credPath, '-', e.message);
    }
  }
}

// Fallback adicional: tentar localizar arquivo padrão no repositório raiz
if (!serviceAccount) {
  // Varredura de diretórios para localizar qualquer JSON válido de service account
  const candidateDirs = [
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../src'),
    process.cwd(),
    path.resolve(process.cwd(), 'api'),
    path.resolve(process.cwd(), 'api/src')
  ];

  function tryLoadServiceAccountFromDir(dir) {
    try {
      if (!fs.existsSync(dir)) return false;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (!f.toLowerCase().endsWith('.json')) continue;
        const full = path.join(dir, f);
        try {
          const json = fs.readFileSync(full, 'utf8');
          const raw = JSON.parse(json);
          if (raw && raw.private_key) raw.private_key = normalizePrivateKey(raw.private_key);
          if (isValidServiceAccount(raw)) {
            // Preferir arquivos com prefixo do projeto, se disponível
            const preferred = /coletoroficial-firebase-adminsdk-fbsvc/i.test(f);
            serviceAccount = raw;
            usingServiceAccount = true;
            console.log('Firebase: credenciais encontradas via varredura em', full, preferred ? '(preferido)' : '');
            return true;
          }
        } catch (_e) {
          // ignorar erros por arquivo não ser JSON válido
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  for (const dir of candidateDirs) {
    if (tryLoadServiceAccountFromDir(dir)) break;
  }
}

let firestoreAvailable = false;

if (!admin.apps.length) {
  try {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: normalizePrivateKey(serviceAccount.private_key)
        }),
        projectId: serviceAccount.project_id,
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://coletoroficial-default-rtdb.firebaseio.com'
      });
      console.log('Firebase Admin SDK inicializado com credenciais do service account');
      console.log('Firebase: projeto', serviceAccount.project_id);
    } else {
      // Tentar credenciais padrão do ambiente
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://coletoroficial-default-rtdb.firebaseio.com'
        });
        console.log('Firebase Admin SDK inicializado com applicationDefault()');
      } catch (e) {
        console.warn('Firebase: falha ao inicializar com applicationDefault():', e.message);
      }
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
    const msg = String(error && error.message || error);
    if (firestoreAvailable) {
      console.warn('Firestore perdeu disponibilidade:', msg);
    } else {
      console.warn('Firestore não está disponível:', msg);
    }
    if (msg && msg.toUpperCase().includes('UNAUTHENTICATED')) {
      console.warn('Dica: verifique se as credenciais do service account são válidas (project_id, client_email, private_key) e possuem acesso ao Firestore. Evite usar applicationDefault com credenciais de usuário locais.');
    }
    firestoreAvailable = false;
    return false;
  }
}

// Executar teste de conexão na inicialização e revalidar periodicamente
if (usingServiceAccount) {
  refreshFirestoreAvailability();
  setInterval(refreshFirestoreAvailability, 60000); // rechecagem a cada 60s
} else {
  console.warn('Firestore: pulando verificações periódicas por não haver service account válido. Configure FIREBASE_CREDENTIALS_PATH ou FIREBASE_SERVICE_ACCOUNT_JSON.');
}

// Função helper para verificar se Firestore está disponível
function isFirestoreAvailable() {
  return firestoreAvailable && firestore !== null;
}

module.exports = {
  admin,
  auth,
  firestore,
  isFirestoreAvailable,
  refreshFirestoreAvailability,
  usingServiceAccount
};