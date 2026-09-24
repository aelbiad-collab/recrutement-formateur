// ════════════════════════════════════════════════════════════
//  Recrutement Formateurs Vacataires — Google Apps Script
//  Reçoit les candidatures (formulaire + CV) et les enregistre
//  dans Google Drive + Google Sheets, puis envoie une alerte email.
// ════════════════════════════════════════════════════════════

const CONFIG = {
  EMAIL_DESTINATAIRE: 'aelbiad@gmail.com',
  NOM_DOSSIER_DRIVE:  'CVTheque',
  NOM_SOUS_DOSSIER:   'CV_Formateurs',
  NOM_SHEET:          'CVTheque_Formateurs',
};

const HEADERS = [
  'Date', 'Nom', 'Prénom', 'Téléphone', 'Email', 'Modules',
  'Expérience formation', 'Statut', 'Expérience technique',
  'Expérience pédagogique', 'Disponibilités', 'Lieu', 'Message', 'CV'
];

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    if (!params.nom || !params.email) {
      throw new Error('Champs obligatoires manquants (nom, email).');
    }
    const cvUrl = enregistrerCV(params);
    enregistrerDansSheet(params, cvUrl);
    envoyerEmail(params, cvUrl);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error('Erreur:', err);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('API Recrutement Formateurs Vacataires — utiliser POST')
    .setMimeType(ContentService.MimeType.TEXT);
}

function enregistrerCV(params) {
  if (!params.cvBase64) return '';
  const dossierCandidats = obtenirOuCreerSousDossier(CONFIG.NOM_DOSSIER_DRIVE, CONFIG.NOM_SOUS_DOSSIER);
  const extension = extensionDepuisNomOuType(params.cvFileName, params.cvMimeType);
  const nomFichier = `${params.nom}_${params.prenom || ''}_CV.${extension}`.replace(/\s+/g, '_');
  const blob = Utilities.newBlob(
    Utilities.base64Decode(params.cvBase64),
    params.cvMimeType || 'application/pdf',
    nomFichier
  );
  const fichier = dossierCandidats.createFile(blob);
  fichier.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return fichier.getUrl();
}

function extensionDepuisNomOuType(nomFichier, mimeType) {
  if (nomFichier && nomFichier.indexOf('.') !== -1) {
    return nomFichier.split('.').pop();
  }
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType && mimeType.indexOf('word') !== -1) return 'docx';
  return 'pdf';
}

function enregistrerDansSheet(params, cvUrl) {
  const dossier = obtenirOuCreerDossier(CONFIG.NOM_DOSSIER_DRIVE);
  const fichiers = dossier.getFilesByName(CONFIG.NOM_SHEET);
  let spreadsheet;
  if (fichiers.hasNext()) {
    spreadsheet = SpreadsheetApp.openById(fichiers.next().getId());
  } else {
    spreadsheet = SpreadsheetApp.create(CONFIG.NOM_SHEET);
    const fichier = DriveApp.getFileById(spreadsheet.getId());
    dossier.addFile(fichier);
    DriveApp.getRootFolder().removeFile(fichier);
  }
  const sheet = spreadsheet.getActiveSheet();
  assurerEnTeteAJour(sheet);
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  sheet.appendRow([
    now,
    params.nom || '',
    params.prenom || '',
    params.telephone || '',
    params.email || '',
    params.modules || '',
    params.experienceFormation || '',
    params.statut || '',
    params.experienceTechnique || '',
    params.experiencePedagogique || '',
    params.disponibilites || '',
    params.lieu || '',
    params.message || '',
    cvUrl || ''
  ]);
}

function assurerEnTeteAJour(sheet) {
  const largeur = Math.max(sheet.getLastColumn(), HEADERS.length);
  const premiereLigne = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, largeur).getValues()[0]
    : [];
  const estAJour = HEADERS.every((h, i) => premiereLigne[i] === h);
  if (!estAJour) {
    sheet.clear();
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setBackground('#f97316')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function echapperHtml(texte) {
  return String(texte || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function envoyerEmail(params, cvUrl) {
  const sujet = `[Candidature] ${params.prenom || ''} ${params.nom} — Formateur vacataire`;
  const ligne = (label, valeur) =>
    `<tr><td style="padding:10px;color:#666;width:40%;border-bottom:1px solid #f0f0f0">${label}</td>` +
    `<td style="padding:10px;border-bottom:1px solid #f0f0f0">${echapperHtml(valeur)}</td></tr>`;
  const ligneCv = cvUrl
    ? `<tr><td style="padding:10px;color:#666">CV</td><td style="padding:10px"><a href="${cvUrl}" style="color:#f97316">Voir le CV</a></td></tr>`
    : `<tr><td style="padding:10px;color:#666">CV</td><td style="padding:10px">Non joint</td></tr>`;
  const corps = `<html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
    <div style="background:#fff;border-radius:12px;padding:32px;max-width:600px;margin:0 auto">
      <h2 style="color:#f97316;margin:0 0 24px">📋 Nouvelle candidature — Formateur vacataire</h2>
      <table style="width:100%;border-collapse:collapse">
        ${ligne('Nom complet', `${params.prenom || ''} ${params.nom}`)}
        ${ligne('Téléphone', params.telephone)}
        ${ligne('Email', params.email)}
        ${ligne('Modules', params.modules)}
        ${ligne('Expérience formation', params.experienceFormation)}
        ${ligne('Statut', params.statut)}
        ${ligne('Expérience technique', params.experienceTechnique)}
        ${ligne('Expérience pédagogique', params.experiencePedagogique)}
        ${ligne('Disponibilités', params.disponibilites)}
        ${ligne('Lieu', params.lieu)}
        ${ligne('Message', params.message)}
        ${ligneCv}
      </table>
    </div>
  </body></html>`;
  MailApp.sendEmail({
    to: CONFIG.EMAIL_DESTINATAIRE,
    subject: sujet,
    htmlBody: corps,
    replyTo: params.email || ''
  });
}

function obtenirOuCreerDossier(nom) {
  const r = DriveApp.getFoldersByName(nom);
  return r.hasNext() ? r.next() : DriveApp.createFolder(nom);
}

function obtenirOuCreerSousDossier(nomParent, nomEnfant) {
  const parent = obtenirOuCreerDossier(nomParent);
  const r = parent.getFoldersByName(nomEnfant);
  return r.hasNext() ? r.next() : parent.createFolder(nomEnfant);
}

function testerScript() {
  const params = {
    nom: 'Test', prenom: 'Candidat', telephone: '0600000000',
    email: 'aelbiad@gmail.com',
    modules: 'Programmation orientée objet, Sites web dynamiques',
    experienceFormation: '1 à 3 ans', statut: 'Freelance / Auto-entrepreneur',
    experienceTechnique: 'Java, PHP/Laravel, React, Docker',
    experiencePedagogique: '2 ans de vacations en centre de formation',
    disponibilites: 'En semaine (soir), Samedi', lieu: 'Casablanca',
    message: 'Candidature de test.'
  };
  const cvUrl = enregistrerCV(params);
  enregistrerDansSheet(params, cvUrl);
  envoyerEmail(params, cvUrl);
}
