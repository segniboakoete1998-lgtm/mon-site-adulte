SEGNIBO & DIEU QUIZ — PWA (FR)
==============================

- Application installable (PWA), hors-ligne, quiz en français.
- Dons: Flooz +228 97829674 · TMoney +228 71258442
- Publicités Google: remplacez votre ID ca-pub-… dans index.html et app.js.

Charger la Bible en français (Louis Segond 1910, domaine public)
----------------------------------------------------------------
1) Onglet "Importer" → choisissez un fichier JSON avec les champs `book, chapter, verse, text` (ex: Genèse, 1, 1, "Au commencement…").
2) Exemple fourni: `bible_fr_sample.json` (quelques versets LSG).
3) Pour toute la Bible FR: préparez un gros JSON et importez-le (ou remplacez le fichier dans le dossier).

Déploiement
-----------
- Hébergez en HTTPS (GitHub Pages, Netlify, Vercel…).
- Ouvrez sur téléphone → "Ajouter à l'écran d'accueil".
- Le service worker gère le cache pour fonctionner comme une app.

Monétisation
------------
- Activez AdSense: remplacez `ca-pub-XXXXXXXXXXXXXXX` par votre ID éditeur.