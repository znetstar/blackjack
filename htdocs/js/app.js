'use strict';

// Taken from http://mzl.la/1OVNxWX
function random_int(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function render_card(id, hidden, value) {
	hidden = !!hidden;
	let suit = Blackjack.Suits[Math.floor(id/13)].name;
	let html = ejs.render(window.card_template, { hidden: hidden, label: CARDS[id], suit: suit, id: id, value: value });
	return html;
};

function render_player (player, hide) {
	lscache.setBucket('templates');
	return ejs.render(lscache.get('hand'), { player: player, hide: (!!hide) });
};

const cards = (window.screen.width/2)+1000;



function load_home () {
	$('body > .container').empty();
	$('.background .start').fadeIn();
	$('.background .logo').removeAttr('style');
	$('.background .card').remove();
	$.get('template/card.html').success(function (data){
		let index = 0;
		window.card_template = data;
		while (index < cards) {
			let card = render_card(random_int(0, 51));
			$(card).appendTo('.background');
			index++;
		}
	});
}

var start_game = function () {
	$(this).fadeOut().off('click');
	$('.background div').css('background', 'transparent');
	$('.background .card').each(function () {
		$(this).css({transition: 'all 10s', position: 'relative' }).animate({ left: random_int(window.screen.width, window.screen.width+1000)+'px', top: random_int(window.screen.height, window.screen.height+1000)+'px' });
	});

	setTimeout(function (){
		$('.background .card').remove();
		$('.background .logo').css({ margin: '0 auto', width: '100%', 'text-align': 'center' }).delay(1000).css({'box-shadow': '0px 0px 10rem white'});
		load_page('setup');
	},4000)
}

$('.start').click(start_game);

var flip_card = window.flip_card = function (card) {
	if ($(card).children('.front').length) {
		card = $('.front',card).first();
	}
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
 	flip_card(this);
 }
}, '.background .card div');

$(document).on({
 click: function () {
 	let players = parseFloat($('input[name="players"]').val()); 
 	window.game = new Blackjack.Game(players);
 	load_page('game');
 }
}, '.start-game');

var load_page = function (page) {
	render_page(page, {}, function (err, page) {
		if (page) {
			$('.container').html(page);
		}
	});
};
 
var render_page = function (page, options, callback) {
	cache_template(page, function (err, data) {
		let template = ejs.render(data, (options || {}));
		callback(null, template);
	});
}

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

load_home();

['hand', 'card', 'control'].forEach(function (name){
	cache_template(name);
});