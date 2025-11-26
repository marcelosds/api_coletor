// api/routes/catalogs.js
const express = require('express');
const router = express.Router();

const catalogsController = require('../controllers/catalogsController');
const { verifyAuth } = require('../middleware/auth');
const { validateNrInventarioQuery } = require('../middleware/validation');

// Todas as rotas requerem autenticação
router.use(verifyAuth);

// Aplicar cabeçalhos no-cache
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

router.get('/locais', validateNrInventarioQuery, catalogsController.getLocais);
router.get('/situacoes', validateNrInventarioQuery, catalogsController.getSituacoes);
router.get('/estados', validateNrInventarioQuery, catalogsController.getEstados);

module.exports = router;