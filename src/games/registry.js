/* Jeux disponibles dans Ardoise. Ajouter un jeu = l'importer et l'ajouter à la liste. */
import skullKing from './skull-king/index.js';
import skyjo from './skyjo/index.js';
import jass from './jass/index.js';
import president from './president/index.js';
import menteur from './menteur/index.js';
import blackjack from './blackjack/index.js';

export const GAMES = [skullKing, skyjo, jass, president, menteur, blackjack];
export const getGame = id => GAMES.find(g => g.id === id) || null;
