# API Backend - Coletor Patrimonial

Este é o backend da aplicação Coletor Patrimonial, desenvolvido em Node.js com Express.js.

## 📋 Índice

- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução](#execução)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Endpoints da API](#endpoints-da-api)
- [Autenticação](#autenticação)
- [Middleware](#middleware)
- [Modelos de Dados](#modelos-de-dados)

## 🚀 Instalação

1. Navegue até o diretório da API:
```bash
cd api
```

2. Instale as dependências:
```bash
npm install
```

## ⚙️ Configuração

1. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```env
# Configurações do servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:19006

# Database
DATABASE_PATH=./data/database.sqlite

# (Deprecado) Firebase
# Removido na migração para SQLite + JWT
```

3. Firebase Admin SDK removido: não é mais necessário.

## 🏃‍♂️ Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

### Testes
```bash
npm test
```

## 📁 Estrutura do Projeto

```
api/
├── src/
│   └── server.js          # Servidor principal
├── config/
│   ├── config.js          # Configurações gerais
│   ├── db/               # Configuração do SQLite
│   └── sqlite.js         # Inicialização e helpers do banco local
├── routes/
│   ├── auth.js           # Rotas de autenticação
│   ├── inventory.js      # Rotas de inventário
│   └── users.js          # Rotas de usuários
├── controllers/
│   ├── authController.js     # Controlador de autenticação
│   └── inventoryController.js # Controlador de inventário
├── middleware/
│   ├── auth.js           # Middleware de autenticação
│   └── validation.js     # Middleware de validação
├── models/               # Modelos de dados (futuro)
├── utils/               # Utilitários (futuro)
├── package.json
├── .env.example
└── README.md
```

## 🔌 Endpoints da API

### Health Check
- `GET /health` - Verifica se a API está funcionando

### Autenticação
- `POST /api/auth/login` - Login com email/senha (JWT)
- `POST /api/auth/register` - Registro de novo usuário (JWT)
- `POST /api/auth/refresh` - Renovação de token JWT
- `POST /api/auth/logout` - Logout do usuário
- `GET /api/auth/me` - Dados do usuário autenticado

### Inventário
- `GET /api/inventory` - Lista inventários (com paginação e busca)
- `POST /api/inventory` - Cria novo inventário
- `GET /api/inventory/:id` - Busca inventário por ID
- `PUT /api/inventory/:id` - Atualiza inventário por ID
- `DELETE /api/inventory/:id` - Remove inventário por ID
- `GET /api/inventory/code/:code` - Busca inventário por código/placa
- `PUT /api/inventory/code/:code` - Atualiza inventário por código/placa
- `POST /api/inventory/sync` - Sincronização em lote

### Usuários
- `GET /api/users/profile` - Perfil do usuário autenticado
- `DELETE /api/users/:id` - Exclui a própria conta e remove no Firebase

## 🔐 Autenticação

A API usa exclusivamente JWT (JSON Web Token):
- Token enviado no header: `Authorization: Bearer <token>`
- Expiração configurável via `JWT_EXPIRES_IN`

## 🛡️ Middleware

### Autenticação (`auth.js`)
- `verifyAuth` - Verifica tokens JWT

### Validação (`validation.js`)
- `handleValidationErrors` - Processa erros de validação
- `validateLogin` - Validação para login
- `validateRegister` - Validação para registro
- `validateInventoryCreate` - Validação para criação de inventário
- `validateInventoryUpdate` - Validação para atualização de inventário
- `validateId` - Validação de IDs
- `validateCode` - Validação de códigos
- `validatePagination` - Validação de parâmetros de paginação

## 📊 Modelos de Dados

### Usuário
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Inventário
```json
{
  "id": "string",
  "userId": "string",
  "codigo": "string",
  "placa": "string",
  "descricao": "string",
  "localizacao": "string",
  "estado": "string",
  "observacoes": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 🔧 Configurações de Segurança

- **Helmet**: Proteção de headers HTTP
- **CORS**: Configuração de origens permitidas
- **Rate Limiting**: Limitação de requisições por IP
- **Compression**: Compressão de respostas
- **Morgan**: Logging de requisições

## 📝 Logs

Os logs são gerados automaticamente pelo Morgan e incluem:
- Método HTTP
- URL da requisição
- Status da resposta
- Tempo de resposta
- Tamanho da resposta

## 🚨 Tratamento de Erros

A API possui tratamento centralizado de erros com:
- Middleware global de tratamento de erros
- Respostas padronizadas para diferentes tipos de erro
- Logs detalhados para debugging

## 🔄 Sincronização

A API suporta sincronização de dados através do endpoint `/api/inventory/sync`:
- Aceita múltiplos itens em uma única requisição
- Cria ou atualiza itens baseado na existência
- Retorna relatório de itens processados

## 📈 Performance

- Compressão automática de respostas
- Paginação em endpoints de listagem
- Índices otimizados no banco de dados
- Cache de configurações

## 🧪 Testes

Para executar os testes:
```bash
npm test
```

Os testes incluem:
- Testes unitários dos controladores
- Testes de integração das rotas
- Testes de middleware
- Testes de autenticação

## 📞 Suporte

Para suporte ou dúvidas sobre a API, consulte a documentação ou entre em contato com a equipe de desenvolvimento."# API - Coletor de Dados "
