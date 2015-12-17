'use strict';

const Blackjack = require('./blackjack');
const Game = Blackjack.Game;

var game = new Game(3);
const states = Blackjack.PLAYER_STATES;

game.start_round()

let a = game.next_player();
a.state = states.HIT;
let b = game.next_player();
b.state = states.HIT;
let c = game.next_player();
c.state = states.HIT;



module.exports = {
	game: game,
	a: a,
	b: b,
	c: c
};