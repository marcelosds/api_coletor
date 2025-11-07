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

// Atualização do perfil do usuário autenticado
const usersController = require('../controllers/usersController');
router.patch('/me', usersController.updateMe);

// Exclusão de usuário (apenas o próprio usuário pode excluir sua conta)
router.delete('/:id', usersController.delete);

module.exports = router;