# Ardoise — plan du projet

Ardoise est un carnet de scores pour jeux de cartes. C'est une web app installable sur iPhone
(PWA), entièrement en français. Elle fonctionne hors ligne et garde ses données sur l'appareil
(`localStorage`).

## Principes techniques

- **Aucune étape de build.** On utilise du HTML, du CSS et du JavaScript natif en modules ES.
  Le site s'héberge tel quel, par exemple sur GitHub Pages. Pour développer en local :
  `npm start`, qui lance un serveur sur <http://localhost:8080>.
  Les modules ES ne marchent pas en ouvrant le fichier directement (`file://`), d'où le serveur.
- **Logique de score pure.** Elle vit dans des fichiers sans DOM, testés avec `node --test`
  (`npm test`) et sans aucune dépendance.
- **Un jeu = un dossier** dans `src/games/<jeu>/`. Ajouter un jeu ne touche pas au reste.

## Structure

```
index.html              coquille : barre du haut, vue, barre d'action, onglets, feuille modale
manifest.webmanifest    manifest PWA
sw.js                   service worker : hors ligne + mise à jour automatique (comme Zeste et ASCEN)
icons/                  logo.svg + icônes PNG générées
fonts/                  Fraunces et Manrope (hébergées, hors ligne)
src/
  styles.css            thème clair/sombre et composants
  app.js                navigation, écrans communs, modification des manches
  core/
    store.js            persistance (localStorage « ardoise.v1 ») + reprise de « skullking.v3 »
    scoring.js          totaux, classement (ex æquo), gagnants, statistiques joueurs
    ui.js               composants : compteur, interrupteur, choix segmenté, feuille, toast, icônes
  games/
    registry.js         liste des jeux disponibles
    skull-king/
      index.js          module : formats, options, points, écran de saisie, éditeur de manche
      scoring.js        calcul des points (pur, testé)
      rules-fr.js       règles affichées dans l'app
      RULES.md          règles retenues, variantes, sources, décisions
    skyjo/ jass/ president/ menteur/ blackjack/   même organisation (index.js, scoring.js, rules-fr.js, RULES.md)
tests/                  npm test (node --test, sans dépendance)
```

## Contrat d'un module de jeu

C'est le contrat appliqué par `src/games/skull-king/index.js`. Les jeux suivants le compléteront,
par exemple avec les équipes pour le Jass ou une fin de partie à score cible pour le Skyjo.

```js
export default {
  id, name, tagline,
  players: { min, max },
  winner: 'highest' | 'lowest',
  formats, defaultFormat,                  // ex. Classique, Éclair…
  options,                                 // variantes : { key, label, type: 'toggle' | 'choice', def, when?, desc }
  defaultOptions(), visibleOptions(opts, n), optionsSummary(opts, n), formatSummary(game, n),
  setup(game),                             // prépare les manches
  isOver(game),
  roundPoints(game, r),                    // points de chaque joueur pour la manche r
  prepareRound?(game),                     // manche suivante quand leur nombre n'est pas fixé (Skyjo)
  finalize?(game, totals, upto),           // ajustement global des totaux (inutilisé pour l'instant)
  firstPlayerLabel?,                       // « Donne en premier » (Skull King) : ordre des joueurs modifiable
  validateRound(game, round),              // { ok, msg }
  roundHead(game, r), progress(game, totals), nextLabel(game), endStats(game, names),
  roundScreen(api, game),                  // écran de saisie de la manche en cours
  editorBody(api, game, draft),            // contenu de « Modifier la manche »
  actions(api),                            // gestionnaires des boutons du module
  rulesHtml
};
```

Le noyau gère tout ce qui est commun aux jeux, et un module ne contient que ce qui est propre au
jeu. Le noyau s'occupe de :

- la création d'une partie et le choix des joueurs ;
- la reprise d'une partie en cours ;
- l'historique et les statistiques ;
- le classement, avec le total affiché une seule fois ;
- la feuille de score ;
- la modification de n'importe quelle manche après coup, avec recalcul automatique.

## Modèle de données

```js
// localStorage['ardoise.v1']
{
  schema: 1,
  players: [ { id, name, createdAt } ],                     // réutilisables d'une partie à l'autre
  games: [                                                  // historique (parties terminées et en cours)
    {
      id, gameId: 'skull-king', status: 'playing' | 'done',
      startedAt, endedAt,
      playerIds: [...],
      options: { scoring: 'sk', loot: true, kraken: true, ... },   // variantes choisies
      rounds: [ { /* données propres au jeu */ }, ... ],            // jamais de total stocké
      format: 'classique', cur: 2, step: 'bid', dealer: 0
    }
  ],
  current: '<id de la partie en cours>' | null,
  prefs: { theme: 'auto' | 'light' | 'dark' },
  legacyImported: true
}
```

On ne stocke **jamais de total**. Les totaux se recalculent toujours à partir des manches,
c'est ce qui garantit que modifier une manche met tout à jour.

Les statistiques par joueur se calculent depuis `games` : parties jouées, victoires, meilleur
score, et des statistiques propres à chaque jeu (pour Skull King, le taux de mises exactes).

La partie de l'ancienne app (`skullking.v3`) est reprise au premier lancement. L'ancienne clé
est conservée intacte, par sécurité.

## Feuille de route

| Phase | Contenu | État |
|---|---|---|
| 0 | Plan, extraction du calcul Skull King + tests, 4 bugs corrigés, manifest PWA | ✅ fait |
| 1 | Noyau Ardoise : accueil, joueurs réutilisables, historique, stats, reprise de l'ancienne sauvegarde ; Skull King devient le 1er module ; nouveau design | ✅ fait |
| 2 | Skyjo et Skyjo Action : saisie du total de chaque grille, doublement automatique, fin à 100 points (RULES.md + tests) | ✅ fait |
| 3 | Jass : Schieber, Coiffeur, Différenzler | ✅ fait (à valider) |
| 4 | Président / Trou du cul | ✅ fait (à valider) |
| 5 | Menteur | ✅ fait (version à valider) |
| 6 | Blackjack (jetons et gains) | ✅ fait (à valider) |
| 7 | Graphiques (fin de partie, joueurs), optimisation, animations | ✅ fait |
| — | Pas de nouveau jeu pour l'instant : l'app reste légère. Icônes définitives à venir. | — |

Pour chaque jeu, on suit les mêmes étapes :

1. Lire les règles officielles (éditeur ou fédération).
2. Écrire le `RULES.md` : règles retenues, variantes et sources.
3. Te poser les questions sur les points ambigus.
4. Écrire les tests de calcul.
5. Coder le module.

## Bugs Skull King corrigés (phase 0)

1. **Kraken / Baleine blanche.** Deux options ont été ajoutées à la création de la partie. Pendant
   la saisie des plis, un compteur « Plis détruits » est disponible. La validation exige
   « plis remportés + plis détruits = cartes distribuées », avec au plus 1 pli détruit par carte
   activée. À 2 joueurs, Barbe Grise prend les plis restants.
2. **Modifications après coup.** Chaque manche validée peut être modifiée : mises, plis, bonus,
   paris, boulet ou chevrotine, plis détruits. Les modifications se font dans une feuille dédiée,
   sur une copie de la manche, avec un aperçu des nouveaux points et totaux. « Annuler » ne change
   rien, et les totaux sont recalculés à l'enregistrement. On y accède par :
   - le bouton « Modifier » du détail de la manche ;
   - les en-têtes de colonne de la feuille de score ;
   - l'historique ;
   - les pastilles de progression ;
   - l'écran de fin de partie.
3. **Total affiché en double.** Les deux valeurs **n'étaient pas identiques**. Le classement du
   haut additionnait aussi les manches pas encore jouées, que le calcul voyait comme des
   « mises à 0 réussies » (+10 × cartes chacune). Par exemple, après la manche 1 : 560 en haut
   contre 20 en bas. Maintenant :
   - le total n'est compté que sur les manches jouées ;
   - il n'est affiché qu'une fois par écran (dans le classement) ;
   - la feuille de score montre les points de chaque manche ;
   - un test garantit que le total est égal à la somme des manches.
4. **Lisibilité.**
   - Classement en tête d'écran, avec les totaux en grand et un bouton « manche suivante » visible
     sans défiler.
   - Contraste du texte secondaire relevé (au moins 4,5:1).
   - Tailles de police augmentées (minimum ~12 px).
   - Zones tactiles agrandies : 44 à 48 px.
   - Aperçu des points de chaque joueur pendant la saisie.
   - Bandeau de validation vert ou rouge.
   - La saisie rapide n'est plus bloquée : l'ancien anti-double-tap avalait les appuis rapides
     sur « + » ; il est remplacé par `touch-action: manipulation`.

## Principes d'ergonomie

- **Loi de Hick : peu de choix par écran.** Un seul bouton principal, en bas, dans la zone du
  pouce. Les variantes sont repliées dans « Règles et variantes », avec des valeurs par défaut
  (règles de base). Pour une nouvelle partie, les joueurs et réglages de la dernière partie sont
  repris. Avec un seul jeu disponible, l'écran de choix du jeu est sauté.
- **Saisie d'une manche en 2 étapes** (mises, puis plis). Les bonus s'ouvrent à la demande,
  dans une feuille dédiée.
- **Peu de couleurs.**
  - Des neutres ardoise et craie.
  - Un seul accent, l'ocre, réservé au leader et à la progression.
  - Le vert et le rouge uniquement pour les points gagnés ou perdus.
  - Aucune couleur par joueur ni par jeu.
- **Confort sur iPhone.**
  - Zones tactiles de 44 px minimum (compteurs de 48 px).
  - Contraste du texte d'au moins 4,5:1.
  - Chiffres tabulaires, pour que les scores restent alignés.
  - Thème clair, sombre ou automatique.
  - Animations courtes, désactivées si l'iPhone demande de réduire les animations.
- **Le total n'est affiché qu'à un endroit**, dans le classement. La feuille de score montre les
  points de chaque manche, et toucher une manche permet de la modifier.

## Mise à jour de l'app

Le fonctionnement est le même que dans Zeste et ASCEN :

1. L'app s'ouvre depuis la copie enregistrée sur l'iPhone, donc instantanément et même hors
   ligne.
2. La dernière version est téléchargée en arrière-plan.
3. Si une nouvelle version arrive pendant le lancement, avant le premier toucher, l'app se
   recharge d'elle-même et affiche « Ardoise est à jour ».
4. Si l'écran a déjà été touché, un message « Nouvelle version d'Ardoise prête · Recharger »
   s'affiche. Sans rien toucher, la nouvelle version s'applique au lancement suivant.
5. Quand l'app revient au premier plan, elle revérifie s'il y a une mise à jour, au plus toutes
   les 30 minutes.

Il n'y a rien à faire à chaque mise en ligne. Les fichiers modifiés sont détectés par leur
empreinte (ETag). Le nom du cache dans `sw.js` ne change que si la liste des fichiers change.

## Identité visuelle

Le design de référence est sur le canevas « Ardoise — design ». Il contient le logo, les
couleurs, la typographie et les écrans iPhone (ouverture, accueil, nouvelle partie,
classement, saisie d'une manche, fin de partie, joueurs).

- **Logo** : quatre traits de craie barrés d'un cinquième, en ocre, sur fond ardoise
  (`icons/logo.svg`).
- **Couleurs** : ardoise `#2E3A44`, craie `#F3EFE6`, ocre `#E3B04B` (seul accent),
  encre `#1D252C`, fond papier `#F5F2EB`, gain `#2E7D57`, perte `#B8433A`.
- **Polices** : Fraunces (serif douce) pour les titres, Manrope pour le texte et les chiffres
  (tabulaires). Elles sont hébergées dans l'app (`fonts/`), pour qu'elle marche hors ligne.

## Décisions prises

- La Tigresse jouée comme Pirate puis capturée par le Skull King vaut +30.
- Boulet de canon : la règle de l'app d'origine est confirmée par les règles officielles
  (voir `RULES.md`).
- Hébergement : GitHub Pages (<https://h9r9zwh7ym-arch.github.io/ARDOISE/>), servi depuis
  `main`. Les parties enregistrées sur le téléphone (`skullking.v3`) sont reprises
  automatiquement.

## Questions ouvertes

Chaque jeu a sa liste « à valider » dans son `RULES.md`. Les principales :

1. **Jass** : les Stöck sont-ils multipliés ? Objectif par défaut 1000 et multiplicateurs activés par défaut : à confirmer.
2. **Président** : à 3 joueurs, les rôles sont Président, Neutre et Trou du cul. Faut-il compter les points de la première manche ?
3. **Menteur** : version avec annonce d'une couleur ou d'une valeur ? Faut-il compter les cartes en main à la fin, ou les cartes ramassées ?
4. **Blackjack** : jetons de départ, mise par défaut, rachat de jetons.
5. **Skyjo** : variantes « maison » plus tard.
