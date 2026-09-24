# Backend Google Apps Script — Recrutement Formateurs Vacataires

Même montage que l'annonce Administrateur Réseaux Systèmes : ce script reçoit
les candidatures envoyées par `index.html`, enregistre le CV dans Google Drive,
ajoute une ligne dans Google Sheets et envoie un email de notification.

Il est **séparé** du script AdminSys pour ne rien casser. Il réutilise le même
dossier Drive `CVTheque`, dans un sous-dossier `CV_Formateurs`, et une nouvelle
feuille `CVTheque_Formateurs`.

## Déploiement (à faire une seule fois)

1. Aller sur https://script.google.com → **Nouveau projet**.
2. Renommer le projet, par exemple `Recrutement_Formateurs`.
3. Remplacer le contenu de `Code.gs` par celui du fichier `Code.gs` de ce dossier.
4. Dans les paramètres du projet (⚙️), activer « Afficher le fichier manifeste
   appsscript.json », puis remplacer son contenu par celui de `appsscript.json`.
5. **Déployer → Nouveau déploiement** → type **Application Web** :
   - Exécuter en tant que : **Moi (aelbiad@gmail.com)**
   - Qui a accès : **Tout le monde**
6. Autoriser les permissions demandées (Drive, Sheets, Gmail).
7. Copier l'URL `.../exec`.
8. Dans `index.html`, remplacer `REMPLACER_PAR_URL_EXEC` par cette URL.

## Test rapide

Dans l'éditeur, choisir la fonction `testerScript` puis **Exécuter** : un email
doit arriver et une ligne apparaître dans `CVTheque_Formateurs`.

## Mise à jour ultérieure

Après modification de `Code.gs` : **Déployer → Gérer les déploiements → ✏️ →
Nouvelle version → Déployer**. L'URL `.../exec` reste la même.

## Hébergement et liens courts

- GitHub Pages : dépôt public `aelbiad-collab/recrutement-formateur`,
  **Settings → Pages** → *Deploy from a branch* → `main` / `(root)`.
  - Accroche : `https://aelbiad-collab.github.io/recrutement-formateur/landing.html`
  - Formulaire : `https://aelbiad-collab.github.io/recrutement-formateur/`
- tinyurl : `offre-formateur-dev` → accroche, `poste-formateur-dev` → formulaire.
- Vérifier l'aperçu LinkedIn : https://www.linkedin.com/post-inspector/
