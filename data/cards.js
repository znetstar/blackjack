'use strict';

// An array of Unicode standard playing cards

// Taken from https://en.wikipedia.org/wiki/Standard_52-card_deck
// $('td[title*="PLAYING CARD"]').map(function () { return $(this).text() })
const CARDS = [ 
	"🂡",
	"🂢", 
	"🂣", 
	"🂤", 
	"🂥", 
	"🂦", 
	"🂧", 
	"🂨", 
	"🂩", 
	"🂪", 
	"🂫",
	"🂭", 
	"🂮", 
	"🂱", 
	"🂲", 
	"🂳", 
	"🂴",
	"🂵",
	"🂶", 
	"🂷", 
	"🂸", 
	"🂹", 
	"🂺", 
	"🂻", 
	"🂽", 
	"🂾",
	"🃁", 
	"🃂", 
	"🃃", 
	"🃄", 
	"🃅",
	"🃆", 
	"🃇", 
	"🃈", 
	"🃉", 
	"🃊",
	"🃋", 
	"🃍", 
	"🃎",
	"🃑", 
	"🃒", 
	"🃓", 
	"🃔", 
	"🃕", 
	"🃖", 
	"🃗", 
	"🃘", 
	"🃙", 
	"🃚", 
	"🃛", 
	"🃝", 
	"🃞", 
];

// if 'module' exists (i.e. running node.js) set module.exports to the array of cards
if (typeof(module) !== 'undefined') 
	module.exports = CARDS;
// if the Blackjack namespace exists (i.e. in the browser) add the cards to the namespace
if (typeof(Blackjack) !== 'undefined')
	Blackjack.Cards = CARDS;