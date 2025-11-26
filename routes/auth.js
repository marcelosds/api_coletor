// api/routes/auth.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { verifyAuth } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');

// Rotas públicas (sem autenticação)
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/refresh-token', authController.refreshToken);
// Login via Firebase: troca idToken por JWT do servidor
// Rota de login via Firebase removida

// Logout protegido
router.post('/logout', verifyAuth, authController.logout);

// Rotas protegidas (com autenticação)
router.get('/me', verifyAuth, authController.me);

module.exports = router;