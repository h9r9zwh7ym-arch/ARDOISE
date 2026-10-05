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
index.html              coquille de l'app (écrans, feuilles modales)
manifest.webmanifest    manifest PWA
sw.js                   service worker (hors ligne)
icons/                  icônes (provisoires : voir icons/README.md)
src/
  styles.css            thème et composants
  app.js                interface (aujourd'hui : Skull King)
  core/                 [phase 1] noyau commun
    store.js            persistance + migrations de schéma
    players.js          joueurs réutilisables
    history.js          historique des parties, statistiques
    ui/                 composants communs (stepper, feuille, classement, feuille de score)
  games/
    registry.js         [phase 1] liste des jeux disponibles
    skull-king/
      scoring.js        calcul des points (pur, testé)
      rules-fr.js       règles affichées dans l'app
      RULES.md          règles retenues, variantes, sources, points ambigus
    skyjo/ jass/ president/ menteur/ blackjack/   [à venir, un par un]
tests/
  skull-king.test.js
```

## Contrat d'un module de jeu (phase 1)

```js
export default {
  id: 'skull-king',
  name: 'Skull King',
  icon: '💀',
  players: { min: 2, max: 8 },
  teams: false,                 // ou { size: 2 } pour le Jass Schieber
  winner: 'highest',            // ou 'lowest' (Skyjo)
  end: { type: 'rounds' },      // ou { type: 'target', value: 100 } (Skyjo), 1000/1500 (Jass)
  variants: [ /* { key, label, description, default, type: 'toggle' | 'choice' } */ ],
  newRound(game, index) {},     // structure de saisie vide d'une manche
  validate(game, round) {},     // { ok, msg } : cohérence de la saisie
  score(game, round) {},        // points par joueur (ou par équipe) pour une manche
  finalize(game, totals) {},    // ajustements de fin de partie (ex. doublement au Skyjo)
  isOver(game, totals) {},
  RoundEditor,                  // composant de saisie et de modification d'une manche
  rules,                        // HTML des règles
};
```

Le noyau gère tout ce qui est commun aux jeux. On n'écrit dans un module que ce qui est propre
au jeu :

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
  players: [ { id, name, avatar, color, createdAt } ],      // réutilisables d'une partie à l'autre
  games: [                                                  // historique (parties terminées et en cours)
    {
      id, gameId: 'skull-king', status: 'playing' | 'done',
      startedAt, endedAt,
      playerIds: [...],
      teams: [[id, id], [id, id]] | null,
      options: { scoring: 'sk', loot: true, kraken: true, ... },   // variantes choisies
      rounds: [ { /* données propres au jeu */ }, ... ],            // jamais de total stocké
      dealer: 0
    }
  ],
  current: '<id de la partie en cours>' | null,
  prefs: { theme: 'auto' | 'light' | 'dark' }
}
```

On ne stocke **jamais de total**. Les totaux se recalculent toujours à partir des manches,
c'est ce qui garantit que modifier une manche met tout à jour.

Les statistiques par joueur se calculent depuis `games` : parties jouées, victoires, meilleur
score, et des statistiques propres à chaque jeu (pour Skull King, le taux de mises exactes).

Les données de l'app actuelle (`skullking.v3`) seront migrées vers le nouveau format au
premier lancement.

## Feuille de route

| Phase | Contenu | État |
|---|---|---|
| 0 | Plan, extraction du calcul Skull King + tests, 4 bugs corrigés, manifest PWA | ✅ fait |
| 1 | Noyau Ardoise : accueil avec choix du jeu, joueurs réutilisables, historique, stats, migration ; Skull King devient le 1er module | à faire |
| 2 | Skyjo (RULES.md + tests) | à faire |
| 3 | Jass : Schieber, puis Coiffeur, Différenzler… | à faire |
| 4 | Trou du cul / Président | à faire |
| 5 | Menteur (version à préciser avec toi) | à faire |
| 6 | Blackjack (jetons et gains) | à faire |
| — | Écran d'ouverture (splash), micro-animations, icônes définitives, thème commun Zeste / Matière / Forge | en continu |

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

## Questions ouvertes

Voir aussi `src/games/skull-king/RULES.md`.

1. **Skull King, Tigresse jouée comme Pirate puis capturée par le Skull King :** vaut-elle +30 ?
2. **Skull King, Boulet de canon :** peux-tu confirmer le barème avec ton livret français ?
3. **Thème :** quelles sont les couleurs, polices et principes visuels de Zeste, Matière et Forge ?
   Un lien ou une capture me suffit.
4. **Hébergement :** l'app est-elle déjà servie quelque part, par exemple sur GitHub Pages ?
   Une PWA doit être servie en HTTPS.
5. **Menteur :** quelle version exactement ? Elle est à préciser avant la phase 5.
