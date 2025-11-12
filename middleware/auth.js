// api/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Users = require('../repositories/userRepo');

// Middleware para verificar JWT token
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de acesso requerido',
        message: 'Forneça um token válido no header Authorization'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Token JWT inválido ou expirado'
      });
    }
  } catch (error) {
    console.error('Erro na verificação JWT:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao verificar autenticação'
    });
  }
};

// Middleware Firebase removido (não utilizado)
const verifyFirebaseToken = async (req, res, next) => {
  return res.status(410).json({
    error: 'Funcionalidade descontinuada',
    message: 'Autenticação Firebase foi removida. Use JWT.'
  });
};

// Middleware de autenticação JWT
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de acesso requerido',
        message: 'Forneça um token válido no header Authorization'
      });
    }
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      if (!decoded || !decoded.uid || !decoded.tenantId) {
        return res.status(401).json({
          error: 'Token inválido',
          message: 'Token sem tenantId'
        });
      }
      const dbUser = Users.getById(String(decoded.uid)) || (decoded.email ? Users.findByEmail(String(decoded.email).trim().toLowerCase()) : null);
      if (dbUser && dbUser.tenantId && String(dbUser.tenantId) !== String(decoded.tenantId)) {
        return res.status(401).json({
          error: 'Tenant inválido',
          message: 'Token não corresponde ao tenant do usuário'
        });
      }
      req.user = decoded;
      req.authType = 'jwt';
      next();
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Token JWT inválido ou expirado'
      });
    }
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao verificar autenticação'
    });
  }
};

module.exports = {
  verifyJWT,
  verifyFirebaseToken,
  verifyAuth
};