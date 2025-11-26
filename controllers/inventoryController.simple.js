// api/controllers/inventoryController.simple.js
// Versão simplificada para testes sem Firebase
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Armazenamento em memória para testes (não usar em produção)
const inventory = new Map();
let nextId = 1;

class SimpleInventoryController {
  // Listar todos os itens do inventário
  async getAllItems(req, res) {
    try {
      console.log('📦 Listando itens do inventário...');
      
      const items = Array.from(inventory.values());
      
      res.status(200).json({
        success: true,
        message: 'Itens do inventário obtidos com sucesso',
        items: items,
        total: items.length
      });
    } catch (error) {
      console.error('❌ Erro ao listar itens:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao listar itens do inventário'
      });
    }
  }

  // Criar novo item no inventário
  async createItem(req, res) {
    try {
      console.log('📦 Criando novo item no inventário...');
      
      const { codigo, descricao, localizacao, observacoes } = req.body;
      const userId = req.user.uid;

      // Criar novo item
      const newItem = {
        id: nextId++,
        codigo,
        descricao,
        localizacao,
        observacoes,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Salvar no armazenamento em memória
      inventory.set(newItem.id, newItem);

      console.log('✅ Item criado com sucesso:', newItem.codigo);

      res.status(201).json({
        success: true,
        message: 'Item criado com sucesso',
        item: newItem
      });
    } catch (error) {
      console.error('❌ Erro ao criar item:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao criar item do inventário'
      });
    }
  }

  // Obter item específico por ID
  async getItemById(req, res) {
    try {
      console.log('📦 Buscando item por ID:', req.params.id);
      
      const itemId = parseInt(req.params.id);
      const item = inventory.get(itemId);

      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item não encontrado',
          message: 'Item não existe no inventário'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Item encontrado com sucesso',
        item: item
      });
    } catch (error) {
      console.error('❌ Erro ao buscar item:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao buscar item do inventário'
      });
    }
  }

  // Atualizar item existente
  async updateItem(req, res) {
    try {
      console.log('📦 Atualizando item:', req.params.id);
      
      const itemId = parseInt(req.params.id);
      const item = inventory.get(itemId);

      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item não encontrado',
          message: 'Item não existe no inventário'
        });
      }

      const { codigo, descricao, localizacao, observacoes } = req.body;

      // Atualizar item
      const updatedItem = {
        ...item,
        codigo: codigo || item.codigo,
        descricao: descricao || item.descricao,
        localizacao: localizacao || item.localizacao,
        observacoes: observacoes || item.observacoes,
        updatedAt: new Date().toISOString()
      };

      inventory.set(itemId, updatedItem);

      console.log('✅ Item atualizado com sucesso:', updatedItem.codigo);

      res.status(200).json({
        success: true,
        message: 'Item atualizado com sucesso',
        item: updatedItem
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar item:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao atualizar item do inventário'
      });
    }
  }

  // Deletar item
  async deleteItem(req, res) {
    try {
      console.log('📦 Deletando item:', req.params.id);
      
      const itemId = parseInt(req.params.id);
      const item = inventory.get(itemId);

      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item não encontrado',
          message: 'Item não existe no inventário'
        });
      }

      inventory.delete(itemId);

      console.log('✅ Item deletado com sucesso:', item.codigo);

      res.status(200).json({
        success: true,
        message: 'Item deletado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao deletar item:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao deletar item do inventário'
      });
    }
  }

  // Método para debug - listar todos os itens
  async debugListItems(req, res) {
    try {
      const items = Array.from(inventory.values());
      
      console.log('📋 Itens no inventário:', items.length);
      
      res.status(200).json({
        success: true,
        count: items.length,
        items: items
      });
    } catch (error) {
      console.error('❌ Erro ao listar itens:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Erro ao listar itens'
      });
    }
  }
}

module.exports = new SimpleInventoryController();