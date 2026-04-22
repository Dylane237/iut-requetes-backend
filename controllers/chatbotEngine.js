// src/controllers/chatbotEngine.js
// Machine à états — gère les 2 flux principaux :
//   1. Correction d'erreur de nom
//   2. Changement de note

const db = require('../config/db');

// ── Réponses prédéfinies ──────────────────────────────
const REPONSES = {
  accueil: [
    '👋 Bonjour ! Je suis l\'assistant UNIBOT de l\'IUT. Comment puis-je vous aider ?',
    '1️⃣ Soumettre une requête de **correction de nom**',
    '2️⃣ Soumettre une requête de **changement de note**',
    '3️⃣ Consulter le **statut** de mes requêtes',
    '4️⃣ En savoir plus sur les **délais de traitement**',
  ].join('\n'),

  menu: '👆 Choisissez une option ou tapez votre question.',

  erreur_nom_intro: `📝 **Correction d'erreur de nom**\n\nPour corriger une erreur dans votre nom, vous devrez fournir :\n• Votre ancien nom (tel qu'il est enregistré)\n• Votre nouveau nom correct\n• Un justificatif officiel (CNI, acte de naissance)\n\n➡️ Cliquez ici pour accéder au formulaire :`,
  erreur_nom_lien: '/requetes/nouveau/erreur-nom',

  changement_note_intro: `📊 **Changement de note**\n\nPour contester une note, vous devrez préciser :\n• La matière concernée\n• Votre note actuelle\n• La note que vous demandez\n• Le motif de votre contestation\n• L'enseignant concerné\n\n➡️ Accédez au formulaire :`,
  changement_note_lien: '/requetes/nouveau/changement-note',

  delais: `⏱️ **Délais de traitement**\n\n• Correction de nom : 5 à 10 jours ouvrés\n• Changement de note : 7 à 14 jours ouvrés (l'enseignant doit valider)\n\nVous serez notifié par email à chaque changement de statut.`,

  statut_connecte: '🔍 Redirection vers votre tableau de bord pour consulter vos requêtes.',
  statut_lien: '/dashboard',

  inconnu: `🤔 Je n'ai pas bien compris votre demande. Voici ce que je peux faire :\n• Répondre à vos questions sur les requêtes\n• Vous guider vers les bons formulaires\n• Vous informer sur les délais\n\nTapez "menu" pour revenir au début.`,

  au_revoir: '👋 Au revoir ! N\'hésitez pas à revenir si vous avez d\'autres questions.',
};

// ── Mots-clés de détection ────────────────────────────
const KEYWORDS = {
  erreur_nom:      ['nom','prénom','prenom','erreur','correction','corriger','civil','état civil','etat civil','registre'],
  changement_note: ['note','notes','changer','modifier','contester','contestation','révision','revision','matière','matiere'],
  statut:          ['statut','état','etat','suivi','suivre','voir','consulter','mes requetes','mes requêtes'],
  delais:          ['délai','delai','durée','duree','combien','temps','long'],
  salutation:      ['bonjour','salut','bonsoir','hello','hi','bj'],
  au_revoir:       ['au revoir','bye','merci','bonne journée','bonne journee'],
  menu:            ['menu','aide','help','retour','recommencer'],
};

function detectIntent(msg) {
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (KEYWORDS.salutation.some(k => m.includes(k)))      return 'salutation';
  if (KEYWORDS.au_revoir.some(k => m.includes(k)))       return 'au_revoir';
  if (KEYWORDS.menu.some(k => m.includes(k)))            return 'menu';
  if (KEYWORDS.erreur_nom.some(k => m.includes(k)))      return 'erreur_nom';
  if (KEYWORDS.changement_note.some(k => m.includes(k))) return 'changement_note';
  if (KEYWORDS.statut.some(k => m.includes(k)))          return 'statut';
  if (KEYWORDS.delais.some(k => m.includes(k)))          return 'delais';
  if (['1','option 1'].includes(m.trim()))                return 'erreur_nom';
  if (['2','option 2'].includes(m.trim()))                return 'changement_note';
  if (['3','option 3'].includes(m.trim()))                return 'statut';
  if (['4','option 4'].includes(m.trim()))                return 'delais';
  return 'inconnu';
}

// ── Handler principal ─────────────────────────────────
exports.handle = async (req, res) => {
  const { message, studentId } = req.body;
  if (!message) return res.status(400).json({ message: 'Message requis.' });

  const intent = detectIntent(message);
  let reply = '';
  let action = null;

  switch (intent) {
    case 'salutation':
    case 'menu':
      reply = REPONSES.accueil;
      action = { type: 'quickReplies', options: ['Corriger mon nom', 'Changer une note', 'Voir mes requêtes', 'Délais de traitement'] };
      break;

    case 'erreur_nom':
      reply = REPONSES.erreur_nom_intro;
      action = { type: 'link', label: '📝 Formulaire correction nom', href: REPONSES.erreur_nom_lien };
      break;

    case 'changement_note':
      reply = REPONSES.changement_note_intro;
      action = { type: 'link', label: '📊 Formulaire changement note', href: REPONSES.changement_note_lien };
      break;

    case 'statut':
      if (studentId) {
        // Récupérer les requêtes récentes si connecté
        try {
          const [rows] = await db.query(
            `SELECT r.id, t.libelle AS type, r.statut, r.created_at
             FROM requetes r JOIN types_requete t ON t.id=r.type_requete_id
             WHERE r.etudiant_id=? ORDER BY r.created_at DESC LIMIT 3`,
            [studentId]
          );
          if (rows.length) {
            const liste = rows.map(r =>
              `• Requête #${r.id} (${r.type}) — **${r.statut.replace('_',' ')}**`
            ).join('\n');
            reply = `📋 Vos dernières requêtes :\n\n${liste}`;
            action = { type: 'link', label: '📊 Voir tout le tableau de bord', href: REPONSES.statut_lien };
          } else {
            reply = '📋 Vous n\'avez pas encore de requêtes. Voulez-vous en soumettre une ?';
            action = { type: 'quickReplies', options: ['Corriger mon nom', 'Changer une note'] };
          }
        } catch {
          reply = REPONSES.statut_connecte;
          action = { type: 'link', label: '📊 Tableau de bord', href: REPONSES.statut_lien };
        }
      } else {
        reply = 'Connectez-vous pour consulter vos requêtes.';
        action = { type: 'link', label: '🔐 Se connecter', href: '/login' };
      }
      break;

    case 'delais':
      reply = REPONSES.delais;
      break;

    case 'au_revoir':
      reply = REPONSES.au_revoir;
      break;

    default:
      reply = REPONSES.inconnu;
      action = { type: 'quickReplies', options: ['Menu principal', 'Corriger mon nom', 'Changer une note'] };
  }

  res.json({ reply, action, intent });
};
