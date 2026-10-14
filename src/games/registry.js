/* Jeux disponibles dans Ardoise. Ajouter un jeu = l'importer et l'ajouter à la liste. */
import skullKing from './skull-king/index.js';

export const GAMES = [skullKing];
export const getGame = id => GAMES.find(g => g.id === id) || null;
