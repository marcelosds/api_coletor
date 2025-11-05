// api/controllers/usersController.js
const Users = require('../repositories/userRepo');
const inventoryRepo = require('../repositories/inventoryRepo');
const { auth: firebaseAuth } = require('../config/firebase');

class UsersController {
  // Excluir usuário e remover do Firebase (se existir)
  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return res.status(400).json({
          error: 'ID inválido',
          message: 'ID do usuário é obrigatório e deve ser string'
        });
      }

      const user = Users.getById(id);
      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Não foi possível localizar o usuário para exclusão'
        });
      }

      // Permitir exclusão apenas do próprio usuário (sem papel de admin)
      const requesterId = req.user?.uid || req.user?.id;
      if (String(requesterId) !== String(id)) {
        return res.status(403).json({
          error: 'Operação não permitida',
          message: 'Você só pode excluir a sua própria conta'
        });
      }

      // Tentar remover usuário no Firebase: preferir UID do token, senão buscar por email
      let firebaseDeleted = false;
      try {
        const tokenFirebaseUid = req.user?.firebaseUid;
        if (tokenFirebaseUid) {
          await firebaseAuth.deleteUser(tokenFirebaseUid);
          firebaseDeleted = true;
        } else {
          const record = await firebaseAuth.getUserByEmail(user.email);
          if (record?.uid) {
            await firebaseAuth.deleteUser(record.uid);
            firebaseDeleted = true;
          }
        }
      } catch (fbErr) {
        // Se não existir no Firebase ou credenciais ausentes, seguir sem erro
        console.warn('[UsersController] Usuário não encontrado no Firebase ou erro ao deletar:', fbErr?.message || fbErr);
      }

      // Remover inventários associados para evitar violação de FK
      const removedInventories = inventoryRepo.deleteByUserId(id);

      // Remover usuário no SQLite
      const removedUser = Users.deleteById(id);
      if (!removedUser) {
        return res.status(500).json({
          error: 'Falha ao excluir usuário',
          message: 'Não foi possível excluir o usuário no banco local'
        });
      }

      return res.json({
        success: true,
        message: 'Usuário excluído com sucesso',
        data: {
          firebaseDeleted,
          removedInventories
        }
      });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao excluir usuário'
      });
    }
  }
}

module.exports = new UsersController();