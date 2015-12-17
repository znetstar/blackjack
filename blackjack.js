'use strict';

// create a new namespace
var Blackjack = {};

Blackjack.Cards = require('./data/cards.js');

// add an array of card types
Blackjack.Suits = (function () {
	const types = [
		{ label: '♠', color: 'black' }, 
		{ label: '♥', color: 'red' },
		{ label: '♦', color: 'red' },
		{ label: '♣', color: 'black' }
	];
	return types;
})();

// add a new class for cards
Blackjack.Card = (function () {
	const ID = 'id';
	class Card {
		constructor(id) {
			if (id > 51) {
				throw new Error('Only 52 cards are in a deck');
			}
			this[ID] = id;
		}

		get suit(){
			return Blackjack.Suits[Math.floor(this[ID]/13)];
		}

		get label() {
			return Blackjack.Cards[this[ID]];
		}

		get value() {
			let val = (this[ID]%13)+1;
			val = ((val > 9) && 10) || val;
			return val;
		}

		toString() {
			return this.label;
		}

		valueOf() {
			return this.value;
		}

	};
	return Card;
})();

// add a new class for decks
Blackjack.Deck = (function () {
	const CARDS_IN_DECK = 52;
	const CARDS = Symbol('cards');

	return class Deck {
		constructor() {
			// create a new array of intergers ranging from 0-51
			const intArray = Array.from(Array(CARDS_IN_DECK).keys());
			// map that array to the Card constructor
			this[CARDS] = intArray.map((int) => new Blackjack.Card(int));
		}
		get cards() {
			// Return an immutable array of cards
			return this[CARDS].slice(0);
		}
		place(card) {
			if (!this[CARDS].some(($card) => $card.id === card.id)) {
				this[CARDS].push(card);
			} else {
				throw new Error('Deck already has card '+card.id);
			}
			return this;
		}
		draw(how_many) {
			how_many = how_many || 1;
			return this[CARDS].splice(0, how_many);
		}
		// Taken from http://bit.ly/1UAD9pJ
		shuffle() {
			const array = this[CARDS];
			var currentIndex = array.length
			var temporaryValue = 0;
			var randomIndex = 0;

			while (0 !== currentIndex) {
			  randomIndex = Math.floor(Math.random() * currentIndex);
			  currentIndex -= 1;

			  temporaryValue = array[currentIndex];
			  array[currentIndex] = array[randomIndex];
			  array[randomIndex] = temporaryValue;
			}

			return this;
		}
	}
})();

Blackjack.PLAYER_STATES = (function () {
	const states = {
		HIT: Symbol('hit'),
		STAY: Symbol('stay'),
		BUST: Symbol('bust'),
		WIN: Symbol('win'),
		NONE: Symbol('none')
	};
	return states;
})()

Blackjack.Player = (function() {
	const HAND = Symbol('hand');
	const PLAYER_STATE = Symbol('state');
	return class Player {
		constructor(name) {
			this[HAND] = [];
			this[PLAYER_STATE] = Blackjack.PLAYER_STATES.NONE;
			this.name = name;
		}
		toString() {
			return this.name+":\n"+this.hand.join(" ");
		}
		get state() {
			return this[PLAYER_STATE];
		}
		set state(state) {
			this[PLAYER_STATE] = state;
		}
		get hand_total() {
			return this.hand.map((card) => card.value).reduce((a,b) => a+b)
		}
		get hand() {
			return this[HAND].slice(0);
		}
		get cards_in_hand() {
			return this[HAND].length;
		}
		take(start, end) {
			return this[HAND].splice(start, end);
		}
		place(cards) {
			if (!cards.some((card) => this[HAND].some(($card) => $card.id === card.id))) {
				this[HAND] = this[HAND].concat(cards);
			} else {
				throw new Error('Hand already has card '+card.id);
			}
			return this;
		}
	};
})()

Blackjack.Game = (function() {
	const CURRENT_ROUND = Symbol('current round');
	const PLAYER_INDEX = Symbol('player index');

	return class Game {
		constructor(num_players) {
			this.deck = new Blackjack.Deck();
			this.deck.shuffle();
			this.in_progress = false;
			this.players = Array
				.from(Array(num_players).keys())
				.map((id) => new Blackjack.Player());
		}
		get current_player() {
			return (this.players[this[PLAYER_INDEX]]);
		}
		start_round() {
			if (this.in_progress)
				this.end_round();
			this.in_progress = true;
			this[CURRENT_ROUND] = Object.keys(this.players).map(Number);
			this[PLAYER_INDEX] = 0;
			return;
		}
		end_game () {
			if (this.in_progress)
				end_round()
			this.players
				.map((player) => player.take(0, player.cards_in_hand))
				.forEach((hand) => 
					hand.forEach((card) => this.deck.place(card))
				);
		}
		end_round () {
			this.in_progress = false;
			this[PLAYER_INDEX] = 0;
		}
		next_player() {
			if (this.deck.cards.length < 1) {
				this.end_game();
			}
			var round = this[CURRENT_ROUND];
			if (round.length > 0) {
				this[PLAYER_INDEX] = round.shift();

				if (this.current_player.hand.length < 2)
					this.current_player.place(this.deck.draw(2));

				return this.current_player;
			}
			else {
				for (var player of this.players) {
					if (player.state === Blackjack.PLAYER_STATES.HIT) {
						player.place(this.deck.draw(1));

						if (player.hand_total === 21) {
							player.state = Blackjack.PLAYER_STATES.WIN;
						} else if (player.hand_total > 21) {
							player.state = Blackjack.PLAYER_STATES.BUST;
						}
					}
				}

				let losers = this.players
					.filter((player) => player.state === Blackjack.PLAYER_STATES.BUST)
					.join("\n");
				let winners = this.players
					.filter((player) => player.state !== Blackjack.PLAYER_STATES.BUST)
					.sort((player_a, player_b) => player_b.hand_total - player_a.hand_total)
					.join("\n");

				console.log("losers", losers)
				console.log("winners", winners)
			}
		}
	};
})()



if (typeof(module) !== 'undefined')
	module.exports = Blackjack
