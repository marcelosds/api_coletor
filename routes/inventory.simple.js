// api/routes/inventory.simple.js
// Versão simplificada para testes sem Firebase
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController.simple');
const { verifyJWT } = require('../middleware/auth');

// Rotas protegidas (requerem autenticação)
router.get('/', verifyJWT, inventoryController.getAllItems);
router.post('/', verifyJWT, inventoryController.createItem);
router.get('/:id', verifyJWT, inventoryController.getItemById);
router.put('/:id', verifyJWT, inventoryController.updateItem);
router.delete('/:id', verifyJWT, inventoryController.deleteItem);

// Rota de debug
router.get('/debug/items', inventoryController.debugListItems);

module.exports = router;