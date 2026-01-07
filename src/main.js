import { Game } from './Game.js';

// Create and start the game
const game = new Game();
game.init();

// Expose game instance for debugging
window.game = game;

console.log('Grid Incremental Game loaded!');
console.log('Debug commands available via window.game.debug');
