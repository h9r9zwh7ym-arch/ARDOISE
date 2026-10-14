# Icônes Ardoise

Les PNG sont générés depuis `logo.svg` : quatre traits de craie barrés d'un cinquième, sur fond ardoise.
Ce logo vient du design Ardoise. Pour le remplacer, garder exactement ces noms :

| Fichier | Taille | Usage |
|---|---|---|
| `apple-touch-icon.png` | 180 × 180 | Écran d'accueil iPhone (`<link rel="apple-touch-icon">`) |
| `icon-192.png` | 192 × 192 | Manifest PWA, favicon |
| `icon-512.png` | 512 × 512 | Manifest PWA (aussi utilisé en `maskable`) |
| `icon-1024.png` | 1024 × 1024 | Manifest PWA, source haute définition |

Contraintes : PNG **sans transparence** (iOS remplit le transparent en noir), motif centré
et lisible en petit, garder l'essentiel dans les 80 % centraux (zone sûre `maskable`).
Après remplacement, incrémenter `VERSION` dans `sw.js` pour que les iPhones récupèrent les nouvelles icônes.
