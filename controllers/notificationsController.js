// src/controllers/notificationsController.js
const db = require('../config/db');

// GET /api/notifications/:userId
exports.list = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    if (req.user.role === 'etudiant' && String(req.user.id) !== String(userId))
      return res.status(403).json({ message: 'Accès refusé.' });

    const [rows] = await db.query(
      `SELECT n.*, r.type_requete_id,
              COALESCE(t.libelle,'') AS type_libelle
       FROM notifications n
       LEFT JOIN requetes r ON r.id = n.requete_id
       LEFT JOIN types_requete t ON t.id = r.type_requete_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`, [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/notifications/:id/lue
exports.marquerLue = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET est_lue=TRUE, lue_le=NOW() WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marquée comme lue.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/notifications/tout-lire
exports.toutLire = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET est_lue=TRUE, lue_le=NOW() WHERE user_id=? AND est_lue=FALSE',
      [req.user.id]
    );
    res.json({ message: 'Toutes les notifications marquées comme lues.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
