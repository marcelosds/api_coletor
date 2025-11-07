// api/controllers/usersController.js
const Users = require('../repositories/userRepo');
const { auth: firebaseAuth } = require('../config/firebase');

class UsersController {
  // Atualiza dados do próprio usuário (nome)
  async updateMe(req, res) {
    try {
      const requesterId = req.user?.uid || req.user?.id;
      const email = req.user?.email;
      const { name, fullName } = req.body || {};
      const newName = (name || fullName || '').trim();

      if (!requesterId && !email) {
        return res.status(400).json({
          error: 'Usuário não identificado',
          message: 'Não foi possível identificar o usuário autenticado'
        });
      }

      if (!newName) {
        return res.status(400).json({
          error: 'Nome inválido',
          message: 'O nome é obrigatório para atualização'
        });
      }

      let updated;
      if (requesterId) {
        updated = Users.updateNameById(String(requesterId), newName);
      } else if (email) {
        updated = Users.updateNameByEmail(String(email).trim().toLowerCase(), newName);
      }

      if (!updated) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Não foi possível localizar usuário para atualização'
        });
      }

      return res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          user: {
            id: updated.id,
            uid: updated.id,
            email: updated.email,
            name: updated.name,
            fullName: updated.name,
            updatedAt: updated.updatedAt,
          }
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao atualizar perfil do usuário'
      });
    }
  }

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
          firebaseDeleted
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