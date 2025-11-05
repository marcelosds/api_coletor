// api/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const Users = require('../repositories/userRepo');
const { auth: firebaseAuth } = require('../config/firebase');

class AuthController {
  // Login com email e senha (JWT) usando SQLite
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validação básica
      if (!email || !password) {
        return res.status(400).json({
          error: 'Dados obrigatórios',
          message: 'Email e senha são obrigatórios'
        });
      }

      if (password.length < 6) {
        return res.status(401).json({
          error: 'Credenciais inválidas',
          message: 'Senha deve ter pelo menos 6 caracteres'
        });
      }

      const user = Users.findByEmail(email.trim().toLowerCase());
      if (!user) {
        return res.status(401).json({
          error: 'Usuário não encontrado',
          message: 'Email não cadastrado'
        });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res.status(401).json({
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos'
        });
      }

      // Gerar JWT token
      const token = jwt.sign(
        {
          uid: user.id,
          email: user.email,
          name: user.name
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Gerar refresh token
      const refreshToken = jwt.sign(
        {
          uid: user.id,
          email: user.email,
          name: user.name,
          type: 'refresh'
        },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
          refreshToken,
          user: {
            id: user.id,
            uid: user.id,
            email: user.email,
            name: user.name,
            fullName: user.name,
            createdAt: user.createdAt
          }
        }
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao realizar login'
      });
    }
  }

  // Registro de novo usuário em SQLite
  async register(req, res) {
    try {
      const { email, password, name, fullName } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const finalName = (name || fullName || '').trim();
      if (!cleanEmail || !password || password.length < 6) {
        return res.status(400).json({
          error: 'Dados inválidos',
          message: 'Email válido e senha (>=6) são obrigatórios'
        });
      }

      const existing = Users.findByEmail(cleanEmail);
      if (existing) {
        return res.status(409).json({
          error: 'Usuário já existe',
          message: 'Este email já está cadastrado'
        });
      }

      // Hash da senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const created = Users.createUser({ email: cleanEmail, password: hashedPassword, name: finalName });

      // Gerar JWT token
      const token = jwt.sign(
        {
          uid: created.id,
          email: created.email,
          name: created.name
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Gerar refresh token
      const refreshToken = jwt.sign(
        {
          uid: created.id,
          email: created.email,
          name: created.name,
          type: 'refresh'
        },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          token,
          refreshToken,
          user: {
            id: created.id,
            uid: created.id,
            email: created.email,
            name: created.name,
            fullName: created.name,
            createdAt: created.createdAt
          }
        }
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao criar usuário'
      });
    }
  }

  // Verificar token Firebase (descontinuado)
  async verifyFirebaseToken(req, res) {
    return res.status(410).json({
      error: 'Funcionalidade descontinuada',
      message: 'Verificação de token Firebase foi removida. Use JWT via /api/auth/login.'
    });
  }

  // Login via Firebase: verifica idToken, garante usuário em SQLite e emite JWT
  async firebaseLogin(req, res) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({
          error: 'idToken requerido',
          message: 'Forneça o idToken do Firebase para autenticação'
        });
      }

      // Verificar token com Firebase Admin
      let decoded;
      try {
        decoded = await firebaseAuth.verifyIdToken(idToken);
      } catch (e) {
        console.error('Erro ao verificar idToken Firebase:', e);
        return res.status(401).json({
          error: 'Token inválido',
          message: 'idToken Firebase inválido ou expirado'
        });
      }

      const cleanEmail = (decoded.email || '').trim().toLowerCase();
      const displayName = (decoded.name || decoded.firebase?.sign_in_provider || cleanEmail || '').trim();

      if (!cleanEmail) {
        return res.status(400).json({
          error: 'Email não disponível',
          message: 'Token Firebase não contém email verificável'
        });
      }

      // Garantir usuário em SQLite
      let user = Users.findByEmail(cleanEmail);
      if (!user) {
        // Criar usuário com senha aleatória (não usada para login JWT direto)
        const randomPassword = await bcrypt.hash('firebase:' + decoded.uid + ':' + Date.now(), 10);
        const created = Users.createUser({ email: cleanEmail, password: randomPassword, name: displayName || cleanEmail });
        user = { id: created.id, email: created.email, name: created.name, createdAt: created.createdAt };
      }

      // Gerar JWT token do servidor
      const token = jwt.sign(
        {
          uid: user.id,
          email: user.email,
          name: user.name,
          firebaseUid: decoded.uid
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Gerar refresh token
      const refreshToken = jwt.sign(
        {
          uid: user.id,
          email: user.email,
          name: user.name,
          firebaseUid: decoded.uid,
          type: 'refresh'
        },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      return res.json({
        success: true,
        message: 'Login via Firebase realizado com sucesso',
        data: {
          token,
          refreshToken,
          user: {
            id: user.id,
            uid: user.id,
            email: user.email,
            name: user.name,
            fullName: user.name,
            createdAt: user.createdAt
          }
        }
      });
    } catch (error) {
      console.error('Erro no firebase-login:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao autenticar via Firebase'
      });
    }
  }

  // Refresh token JWT
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token requerido',
          message: 'Refresh token é obrigatório'
        });
      }

      // Verificar refresh token (implementação simplificada)
      const decoded = jwt.verify(refreshToken, config.jwt.secret);

      // Gerar novo token
      const newToken = jwt.sign(
        {
          uid: decoded.uid,
          email: decoded.email,
          name: decoded.name
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          token: newToken
        }
      });

    } catch (error) {
      console.error('Erro no refresh token:', error);
      res.status(401).json({
        error: 'Refresh token inválido',
        message: 'Refresh token inválido ou expirado'
      });
    }
  }

  // Logout (invalidar token - implementação básica)
  async logout(req, res) {
    try {
      // Em uma implementação completa, você manteria uma blacklist de tokens
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao realizar logout'
      });
    }
  }

  // Verificar status de autenticação
  async me(req, res) {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          user,
          authType: req.authType || 'unknown'
        }
      });
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao obter dados do usuário'
      });
    }
  }
}

module.exports = new AuthController();