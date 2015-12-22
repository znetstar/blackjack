'use strict';

// Returns a random int between min and max
function random_int(min, max) {
  return Blackjack.Chance.integer({min: min, max: max });
}


// Renders a card using the EJS template at 'template/card.html'
function render_card(id, hidden, value) {
	// Let the variable indicating if the card should be initally hidden be a Boolean true or false
	hidden = Boolean(hidden);
	// Grab the suit of the card (by dividing the id by 13)
	let suit = Blackjack.Suits[Math.floor(id/13)].name;
	// Actually render the HTML of the card
	let html = ejs.render(window.card_template, { hidden: hidden, label: CARDS[id], suit: suit, id: id, value: value });
	// And return the HTML
	return html;
};

// Renders a player using the EJS template located at 'template/hand.html'
function render_player (player, hide) {
	// Set the lscache bucket (localStorage) to templates
	lscache.setBucket('templates');
	// Grab the 'hand' template from the localStoage cache
	// and return the HTML obtained by rendering the template
	return ejs.render(lscache.get('hand'), { player: player, hide: (!!hide) });
};

// The number of cards that will be displayed on the loading screen
const number_of_cards = (window.screen.width/2)+500;

function load_home () {
	// Empty the main content section
	$('body > .container').empty();
	// and fade in the start button
	$('.background .start').fadeIn();
	// remove all style modifications from the logo
	$('.background .logo').removeAttr('style');
	// then remove all cards from the loading screen
	$('.background .card').remove();
	// After the card template has succesfully be grabbed via XHR
	$.get('template/card.html').success(function (data){
		// set the index of cards to zero
		let index = 0;
		// put the card into a variable on the global scope
		window.card_template = data;
		// while the index of cards is lower than the number of cards
		while (index < number_of_cards) {
			// Render a card with a random id between 0 and 51
			let card = render_card(random_int(0, 51));
			// Then append that card to the background
			$(card).appendTo('.background');
			// and increment the index
			index++;
		}
	});
}

var start_game = function () {
	// When the start button is pressed make sure it cannot be pressed again
	$(this).fadeOut().off('click');
	// Make the background transparent
	$('.background div').css('background', 'transparent');
	
	/* Loading screen animation */
	// Give a minimum delay of 4 millliseconds between each card falling
	var delay = 4;
	// Create an array to hold each of the setTimeouts 
	var timeouts = [];
	// Iterate through all the cards on the loading screen
	$('.background .card').each(function () {
		// Wait 'delay' milliseconds before making the card fall
		timeouts.push(setTimeout(function (ele) {
			// Set the 'left' and 'top' of the card to a random int between the current windows width and height and the current windows with and height plus 1000
			$(ele).css({transition: 'all 10s', position: 'relative' }).velocity({ left: random_int(window.screen.width, window.screen.width+1000)+'px', top: random_int(window.screen.height, window.screen.height+1000)+'px' });
		}, delay, this));
		// Add ten milliseconds to the delay
		delay = delay + 10;
	});

	// After five seconds
	setTimeout(function (){
		// Loop through each of the timeouts that are bound to each falling card and cancel the timeout
		// this prevents cards from falling after the game has started
		timeouts.forEach(function (t) { clearTimeout(t);});
		// Remove all the cards from the loading screen
		$('.background .card').remove();
		// Move the logo into the center of the screen
		$('.background .logo').css({ margin: '0 auto', width: '100%', 'text-align': 'center' }).delay(1000).css({});
		// and load the setup page
		load_page('setup');
	},5000)
}

// when the start button is pressed start the game
$('.start').click(start_game);

// the flip card function hides the face of the card and shows a blank card '🂠' in its place
var flip_card = window.flip_card = function (card) {
	// if the card container div is passed rather than the card front div, make the 'card' variable equal the card front div
	if ($(card).children('.front').length) {
		card = $('.front',card).first();
	}
	// Swap the contents of the 'value' attribute with the text of the card's front side
	if ($(card).attr('value')) {
 		let txt = $(card).text().toString();
 		$(card).text($(card).attr('value'))
 		$(card).attr('value', txt);
 	} else {
 		$(card).attr('value', $(card).text());
	}
	if (!$(card).parents('.card').hasClass('front-side')){
		$(card).parents('.card').removeClass('front-side').addClass('back-side');
	}
	else {
		$(card).parents('.card').removeClass('back-side').addClass('front-side');
	}

};

$(document).on({
 click: function () {
 	// When a card on the loading screen is clicked, flip it
 	flip_card(this);
 }
}, '.background .card div');

$(document).on({
 click: function () {
 	// Play button is pressed on the setup screen
 	// grab the number of players and store it in a variable
 	let players = parseFloat($('input[name="players"]').val()); 
 	// Create a new game with 'players' players
 	window.game = new Blackjack.Game(players);
 	// and load the main game's HTML
 	load_page('game');
 }
}, '.start-game');

// The 'load_page' function loads page HTML via the 'cache_template' function, renders it, and inserts it into the main content div
var load_page = window.load_page = function (page) {
	render_page(page, {}, function (err, page) {
		if (page) {
			$('.container').html(page);
		}
	});
};
 
 // 'render_page' loads a page using the 'cache_template' function and renders it using EJS 
var render_page = window.render_page = function (page, options, callback) {
	cache_template(page, function (err, data) {
		let template = ejs.render(data, (options || {}));
		callback(null, template);
	});
}

// 'cache_template' loads a page from the localStorage cache if it exists, or grabs the template from XHR
function cache_template(page, callback) {
	lscache.setBucket('templates');
	if (lscache.get(page)) {
		return callback && callback(null, lscache.get(page));
	}
	$.get('template/'+page+'.html', function (data) {
		lscache.set(page, data);

		callback && callback(null, data);
	});
}

// Load the home screen
load_home();

// Grab the 'hand', 'card' and 'control templates'
['hand', 'card', 'control'].forEach(function (name){
	cache_template(name);
});