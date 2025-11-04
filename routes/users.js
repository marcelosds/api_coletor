// api/routes/users.js
const express = require('express');
const router = express.Router();

const { verifyAuth } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(verifyAuth);

// Rota básica para informações do usuário (já implementada em auth/me)
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      authType: req.authType || 'unknown'
    }
  });
});

module.exports = router;