// api/controllers/authController.simple.js
// Versão simplificada para testes sem Firebase
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

// Armazenamento em memória para testes (não usar em produção)
const users = new Map();

class SimpleAuthController {
  // Login com email e senha (JWT) - versão simplificada
  async login(req, res) {
    try {
      console.log('🔐 Tentativa de login:', req.body.email);
      
      const { email, password } = req.body;

      // Buscar usuário no armazenamento em memória
      const user = users.get(email);

      if (!user) {
        console.log('❌ Usuário não encontrado:', email);
        return res.status(401).json({
          success: false,
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos'
        });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('❌ Senha inválida para:', email);
        return res.status(401).json({
          success: false,
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

      console.log('✅ Login bem-sucedido para:', email);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        user: {
          uid: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Erro no login:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao realizar login'
      });
    }
  }

  // Registro de novo usuário - versão simplificada
  async register(req, res) {
    try {
      console.log('👤 Tentativa de registro:', req.body.email);
      
      const { email, password, name } = req.body;

      // Verificar se usuário já existe
      if (users.has(email)) {
        console.log('⚠️ Usuário já existe:', email);
        return res.status(400).json({
          success: false,
          error: 'Usuário já existe',
          message: 'Este email já está cadastrado'
        });
      }

      // Hash da senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Criar usuário
      const userId = Date.now().toString();
      const newUser = {
        id: userId,
        email,
        password: hashedPassword,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Salvar no armazenamento em memória
      users.set(email, newUser);

      // Gerar JWT token
      const token = jwt.sign(
        {
          uid: userId,
          email,
          name
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      console.log('✅ Usuário criado com sucesso:', email);

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        token,
        user: {
          uid: userId,
          email,
          name,
          createdAt: newUser.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Erro no registro:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao criar usuário'
      });
    }
  }

  // Verificar token Firebase - versão simplificada (não implementada)
  async verifyFirebaseToken(req, res) {
    res.status(501).json({
      success: false,
      error: 'Não implementado',
      message: 'Verificação Firebase não disponível na versão simplificada'
    });
  }

  // Refresh token JWT - versão simplificada
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token requerido',
          message: 'Refresh token é obrigatório'
        });
      }

      // Verificar refresh token
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
        token: newToken
      });

    } catch (error) {
      console.error('Erro no refresh token:', error);
      res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'Refresh token inválido ou expirado'
      });
    }
  }

  // Logout - versão simplificada
  async logout(req, res) {
    try {
      // Em uma implementação real, você invalidaria o token
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao realizar logout'
      });
    }
  }

  // Obter dados do usuário atual - versão simplificada
  async me(req, res) {
    try {
      const user = req.user; // Vem do middleware de autenticação

      res.json({
        success: true,
        message: 'Dados do usuário obtidos com sucesso',
        user: {
          uid: user.uid,
          email: user.email,
          name: user.name
        }
      });

    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao obter dados do usuário'
      });
    }
  }

  // Método para listar usuários (apenas para debug)
  async listUsers(req, res) {
    try {
      const userList = Array.from(users.values()).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }));

      res.json({
        success: true,
        message: 'Lista de usuários obtida com sucesso',
        users: userList,
        total: userList.length
      });

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao listar usuários'
      });
    }
  }
}

module.exports = new SimpleAuthController();