// api/controllers/catalogsController.js
const inventoryRepo = require('../repositories/inventoryRepo');

class CatalogsController {
  async getLocais(req, res) {
    try {
      const { nrInventario } = req.query;
      const data = inventoryRepo.distinctLocais(nrInventario || null);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Erro ao obter locais:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao obter catálogo de locais'
      });
    }
  }

  async getSituacoes(req, res) {
    try {
      const { nrInventario } = req.query;
      const data = inventoryRepo.distinctSituacoes(nrInventario || null);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Erro ao obter situações:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao obter catálogo de situações'
      });
    }
  }

  async getEstados(req, res) {
    try {
      const { nrInventario } = req.query;
      const data = inventoryRepo.distinctEstados(nrInventario || null);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Erro ao obter estados:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao obter catálogo de estados'
      });
    }
  }
}

module.exports = new CatalogsController();