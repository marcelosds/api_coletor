// api/routes/auth.simple.js
// Versão simplificada para testes sem Firebase
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController.simple');
const { verifyAuth } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');

// Rotas públicas (sem autenticação)
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/verify-firebase-token', authController.verifyFirebaseToken);
router.post('/refresh-token', authController.refreshToken);

// Rotas protegidas (com autenticação)
router.post('/logout', verifyAuth, authController.logout);
router.get('/me', verifyAuth, authController.me);

// Rota adicional para debug
router.get('/users', authController.listUsers);

module.exports = router;