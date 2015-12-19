'use strict';

// create a new namespace
var Blackjack = {};

if (typeof(require) !== 'undefined') 
	Blackjack.Cards = require('./data/cards.js');

// add an array of card types
Blackjack.Suits = (function () {
	const types = [
		{ label: '♠', name: 'spades' }, 
		{ label: '♥', name: 'hearts' },
		{ label: '♦', name: 'diamonds' },
		{ label: '♣', name: 'clubs' }
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

Blackjack.Ace = (function () {
	const ACE_CUSTOM_VALUE = Symbol('custom value');
	return class Ace extends Blackjack.Card {
		constructor(id) {
			if (![0, 13, 26, 39].some((x) => x === id)) {
				throw new Error('Aces can only be ids 0, 13, 26 or 39 ('+[Blackjack.Cards[0], Blackjack.Cards[13], Blackjack.Cards[26], Blackjack.Cards[39	]].join(',')+')');
			} else {
				super(id);
			}
		}

		get value() {
			return this[ACE_CUSTOM_VALUE] || super.value;
		}

		set value(val) {
			if (val !== 1 && val !== 11) {
				throw new Error('An ace must equal 1 or 11');
			}
			this[ACE_CUSTOM_VALUE] = val;
		}
	};
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
			this[CARDS] = intArray.map(function (id) {
				switch (id) {
					case 0:
					case 13:
					case 26:
					case 39:
						return new Blackjack.Ace(id);
						break;
					default:
						return new Blackjack.Card(id);
						break;
				}
			});
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
			this.score = 0;
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

Blackjack.Dealer = (function () {
	return class Dealer extends Blackjack.Player {
		constructor() {
			super('Dealer');
		}
	};
})();

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
				.map((id) => ((id > 0) && new Blackjack.Player('Player '+id)) || new Blackjack.Dealer());
		}
		get round_in_progress() {
			return (this[CURRENT_ROUND].length > 0);
		}
		get current_player() {
			return (this.players[this[PLAYER_INDEX]]);
		}
		get winners () {
			return this.players
					.filter((player) => (player.state !== Blackjack.PLAYER_STATES.BUST) && (player.hand_total < 22))
					.sort((player_a, player_b) => player_b.hand_total - player_a.hand_total);
		}
		get losers () {
			return this.players
					.filter((player) => player.state === Blackjack.PLAYER_STATES.BUST);
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

		}
		end_round () {
			this.in_progress = false;
			this[PLAYER_INDEX] = 0;
			this.players
				.map((player) => player.take(0, player.cards_in_hand))
				.forEach((hand) => 
					hand.forEach((card) => this.deck.place(card))
				);
		}
		process_play(player) {
			player.previous_state = player.state;
			if (player.state === Blackjack.PLAYER_STATES.HIT) {
				player.place(this.deck.draw(1));

				if (player.hand_total === 21) {
					player.state = Blackjack.PLAYER_STATES.WIN;
				} else if (player.hand_total > 21) {
					player.state = Blackjack.PLAYER_STATES.BUST;
				}
			}
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
					this.process_play(player);
				} 
			}
		}
	};
})()



if (typeof(module) !== 'undefined')
	module.exports = Blackjack
