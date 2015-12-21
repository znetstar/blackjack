'use strict';
/* Blackjack JavaScript Game */

// create a new namespace
var Blackjack = {};

// if require exists (i.e. running on node.js) load the array of standard playing cards from 'cards.js'
if (typeof(require) !== 'undefined') {
	Blackjack.Cards = require('./data/cards.js');
	let Chance = require('chance');
	Blackjack.Chance = new Chance();
} else if ((typeof(window) !== 'undefined') && (typeof(window.Chance) !== 'undefined')) {
	let Chance = window.Chance;
	Blackjack.Chance = new Chance();
}



// add an array of card suits, with both their unicode symbol and label
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
	// making the ID property a string makes it Public, if it was a Symbol, it would be private
	const ID = 'id';

	// the 'Card' class represents a standard playing card
	class Card {
		// the ID of the card is the index in which the card would appear in an unshuffled deck, starting at 0 which is the 🂡
		constructor(id) {
			// if the card's index is more than 51 or less than 0 throw an execption
			if (id > 51 || id < 0) {
				throw new Error('Only 52 cards are in a deck');
			}

			this[ID] = id;
		}

		// gets the suit of the card (0-4) by dividing the ID by 13 and rounding down
		get suit(){
			return Blackjack.Suits[Math.floor(this[ID]/13)];
		}

		// gets the symbolic representation of the card as a unicode character (i.e. ace of spades would be 🂡)
		get label() {
			return Blackjack.Cards[this[ID]];
		}

		// gets the numeric value of the card by taking the remainder of the ID divided by 13 and adding 1 (i.e. aces would be 0 + 1 or 1)
		get value() {
			let val = (this[ID]%13)+1;
			val = ((val > 9) && 10) || val;
			return val;
		}

		// calling toString() will return the symbolic (unicode character) representation of the card
		toString() {
			return this.label;
		}

		// calling valueOf() will return the numeric representation of card
		valueOf() {
			return this.value;
		}

	};
	return Card;
})();

/* 
	Since calling valueOf() on any Card object returns its numeric value, arithmetic operations can be carried out on the objects themselves 
	example:
		let two_of_spades = new Blackjack.Card(1);
		let three_of_spades = new Blackjack.Card(2);
		
		let value = ((two_of_spades + three_of_spades);

		value === 5;
*/

// The 'Ace' class is any card with an id of 0 (spades), 13 (hearts), 26 (diamonds) or 39 (clubs)
// aces can have a value of 1 or 11 which can be set using the 'value' property
Blackjack.Ace = (function () {
	// The custom value property is a Symbol which makes it private
	const ACE_CUSTOM_VALUE = Symbol('custom value');

	return class Ace extends Blackjack.Card {
		constructor(id) {
			// if an ace is created with a value other than 0, 13, 26 or 39, thow an error
			if (![0, 13, 26, 39].some((x) => x === id)) {
				throw new Error('Aces can only be ids 0, 13, 26 or 39 ('+[Blackjack.Cards[0], Blackjack.Cards[13], Blackjack.Cards[26], Blackjack.Cards[39	]].join(',')+')');
			} else {
				// otherwise call the Card constructor with the ID
				super(id);
			}
		}

		// if the ace has a Symbol('custom value') property set (e.g. 11 instead of the default, 1) return the custom value or return the default (1)
		get value() {
			return this[ACE_CUSTOM_VALUE] || super.value;
		}

		// unlike the Card object, the 'value' property can be set
		set value(val) {
			// if a value is set to something other than 11 or 1 throw an error
			if (val !== 1 && val !== 11) {
				throw new Error('An ace must equal 1 or 11');
			}
			// other wise set the Symbol('custom value') property
			this[ACE_CUSTOM_VALUE] = val;
		}
	};
})();

// the 'Deck' class represents a collection of 52 cards
Blackjack.Deck = (function () {
	// the size of the deck is stored in a constant 'CARDS_IN_DECK'
	const CARDS_IN_DECK = 52;
	// an internal private a array holds the actual card objects and is set in the Symbol('cards') property 
	const CARDS = Symbol('cards');

	return class Deck {
		constructor() {
			// taken from http://bit.ly/1Ys7Jrf
			// this is a reimplmentation of the Python 'range' function
			let range = ((size) => Array.from(Array(size).keys()));
			
			// create a new array of intergers ranging from 0 to the total size of the deck 'CARDS_IN_DECK'
			// map that array of intergers to a new 'Card'
			// if the ID is 0, 13, 26 or 39 return a new 'Ace' otherwise return a new 'Card'
			this[CARDS] = range(CARDS_IN_DECK).map((id) => (([0,13,26,39].some((ace_id) => ace_id === id) && (new Blackjack.Ace(id))) || new Blackjack.Card(id)));
		}	
		// return an immutable array of all cards in the deck
		// changing elements in the array won't effect the actual this[CARDS] array
		get cards() {
			return this[CARDS].slice(0);
		}
		// place a card back into deck
		// if the card is already present in the deck an error will be thrown
		place(card) {
			if (!this[CARDS].some(($card) => $card.id === card.id)) {
				this[CARDS].push(card);
			} else {
				throw new Error('Deck already has card '+card.id);
			}
			return this;
		}
		// dispense 'how_many' cards as an array, removing from the this[CARDS] array
		// if 'how_many' is falsey a single card will be dispensed
		draw(how_many) {
			how_many = how_many || 1;
			return this[CARDS].splice(0, how_many);
		}
		// An implementation of Fisher-Yates (aka Knuth) Shuffle
		// Taken from http://bit.ly/1UAD9pJ
		shuffle() {
			// Link the array variable to this[CARDS]
			this[CARDS] = Blackjack.Chance.shuffle(this[CARDS]);
			
			return this;
		}
	}
})();

// An enumerated type of possible player states
Blackjack.PLAYER_STATES = (function () {
	const states = {
		HIT: Symbol('hit'), // The player decided hit
		STAY: Symbol('stay'), // The player decided to stay
		BUST: Symbol('bust'), // The player's 'hand_total' went over 21 (bust)
		WIN: Symbol('win'), // The player wins either by having the hand with the greatest 'hand_total' or by being the last player to not go over 21
		NONE: Symbol('none') // The player hasn't made a move yet (default)
	};
	return states;
})()

// the 'Player' class represents a player in the game 
Blackjack.Player = (function() {
	// an array of the cards the player currently holds
	const HAND = Symbol('hand');
	// as well as the player's current state
	const PLAYER_STATE = Symbol('state');
	// are stored as private variables (Symbols) so they cannot be tampered with
	
	return class Player {
		constructor(name) {
			// initally the hand empty (the player holds no cards)
			this[HAND] = [];
			// the score is zero
			this.score = 0;
			// and the state is none
			this[PLAYER_STATE] = Blackjack.PLAYER_STATES.NONE;
			
			// if no name is provided throw an error
			if (!name) {
				throw new Error('No name provided');
			}

			this.name = name;
		}
		// when cast as a string the player's name and score are formatted as a string
		toString() {
			return this.name+":\n"+this.hand.join(" ");
		}
		// the state property returns the user's state (last move)
		get state() {
			return this[PLAYER_STATE];
		}
		set state(state) {
			this[PLAYER_STATE] = state;
		}

		// the 'hand_total' property returns the total value of all the cards currently in the player's hand
		get hand_total() {
			return this.hand
				.map((card) => card.value) // map each card to its value
				.reduce((a,b) => a+b); // get the sum of all the values 
		}
		get hand() {
			// Return an immutable array of the cards currently in the player's hand
			return this[HAND].slice(0);
		}
		get cards_in_hand() {
			// Return the length of the cards in the players hand
			return this[HAND].length;
		}
		// remove cards starting from 'start' and ending at 'end' from the player's hand and return them as an array
		take(start, end) {
			return this[HAND].splice(start, end);
		}
		// place an aray of cards (or a single card) into the player's hand
		// if a card is already in the player's hand an error is thrown
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

// The 'Dealer' is a 'Player' with the name 'Dealer'
// the dealer is always the first 'Player' in the 'players' property of a 'Game'  
// making the dealer a seperate class allows us to differentiate players from the dealer by doing:
//	let dealer = new Dealer();
//	(dealer instanceof Dealer)
Blackjack.Dealer = (function () {
	return class Dealer extends Blackjack.Player {
		constructor() {
			super('Dealer');
		}
	};
})();

// A 'Game' is a Blackjack Game with at least two players and a single deck of 52 cards
Blackjack.Game = (function() {
	// Make the index of the current round and index of the current player private
	const CURRENT_ROUND = Symbol('current round');
	const PLAYER_INDEX = Symbol('player index');

	return class Game {
		// Create a new Game
		constructor(num_players) {
			// if the game has less than two players throw an error
			if (num_players < 2) {
				throw new Error('A game must have at least two players');
			}
			// otherwise initialize a new deck
			this.deck = new Blackjack.Deck();
			// and shuffle it
			this.deck.shuffle();

			// taken from http://bit.ly/1Ys7Jrf
			// this is a reimplmentation of the Python 'range' function
			let range = ((size) => Array.from(Array(size).keys()));

			// the game is not in progress until a round is started
			this.in_progress = false;
			this.players = range(num_players)
				.map((id) => ((id > 0) && new Blackjack.Player('Player '+id)) || new Blackjack.Dealer());
		}
		// the round is in progress provided the current round still has players
		get round_in_progress() {
			return (this[CURRENT_ROUND].length > 0);
		}
		// the current player is the player at the current player index
		get current_player() {
			return (this.players[this[PLAYER_INDEX]]);
		}
		// winners are players whose 'hand_total' are not over 21 sorted from the greatest hand total to least 
		get winners () {
			return this.players
					.filter((player) => (player.state !== Blackjack.PLAYER_STATES.BUST) && (player.hand_total < 22))
					.sort((player_a, player_b) => player_b.hand_total - player_a.hand_total);
		}
		// losers are players whose 'hand_totals' are over 21
		get losers () {
			return this.players
					.filter((player) => player.state === Blackjack.PLAYER_STATES.BUST);
		}
		// start the round
		start_round() {
			// if a round is already in progess
			if (this.in_progress)
				// end the existing round
				this.end_round();

			this.in_progress = true;
			// the current round array contians the index of each player [ Dealer => 0, Player_1 => 1... etc ]
			this[CURRENT_ROUND] = Object.keys(this.players).map(Number);
			
			// the player index is zero (the dealer starts)
			this[PLAYER_INDEX] = 0;

			// shuffle the deck
			this.deck.shuffle();
			return;
		}
		end_game () {
			// when the game ends the round ends
			if (this.in_progress)
				end_round()
		}
		end_round () {
			// when the round ends set the is_progress bool to false
			this.in_progress = false;
			// set the player index back to zero
			this[PLAYER_INDEX] = 0;

			this.players
				// take the cards out of each player's hand
				.map((player) => player.take(0, player.cards_in_hand))
				// and place each card back into the deck
				.forEach((hand) => 
					hand.forEach((card) => this.deck.place(card))
				);
		}
		// process the play of the current player
		process_play(player) {
			// set the previous state of the player
			player.previous_state = player.state;
			// if the player decides to hit
			if (player.state === Blackjack.PLAYER_STATES.HIT) {
				// draw a single card from the deck and place it in player's hand
				player.place(this.deck.draw(1));

				// if the hand total is exactly 21
				if (player.hand_total === 21) {
					// 🏆 the player wins! 🏆 
					player.state = Blackjack.PLAYER_STATES.WIN;
				} else if (player.hand_total > 21) {
					// if the player's hand exceeds 21
					// ☹ the player loses ☹
					player.state = Blackjack.PLAYER_STATES.BUST;
				}
			}
		}
		// increment the player index and allow the next player to play
		next_player() {
			var round = this[CURRENT_ROUND];
			// if the round still has players
			if (round.length > 0) {
				// set the current player to index of the current player
				this[PLAYER_INDEX] = round.shift();

				// if the player has less than two cards in their hand add two cards to the player's hand
				if (this.current_player.hand.length < 2)
					this.current_player.place(this.deck.draw(2));

				// return the current player
				return this.current_player;
			}
			else {
				// otherwise process the actions each player has taken in the previous round
				for (var player of this.players) {
					this.process_play(player);
				} 
			}
		}
	};
})()

// if 'module' exists (i.e. running node.js) set module.exports to the Blackjack namespace
if (typeof(module) !== 'undefined')
	module.exports = Blackjack