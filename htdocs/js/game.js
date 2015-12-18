'use strict';

window.turn_index = 0;

function render_control(type, text) {
	lscache.setBucket('templates');
	return ejs.render(lscache.get('control'), { type: type, text: text });
}

function bind_control (name, func) {
	$(document).on({
		click: func
	}, '.controls .control.'+name)
}

function get_player (element) {
	return window.game.players.filter(function (player) {
		return player.name === $(element).attr('data-name');
	})[0];
};

function get_element (player) {

}

function draw_winner (winner) {
	$('.controls').empty();
	let $winner = $('[data-name="'+winner.name+'"]');
	if (winner) {	

		$('.game .hands .hand')
			.not($winner)
			.fadeOut()

		$winner
			.fadeIn()
			.addClass('winner')
			.addClass('active')
			.removeClass('four')
			.addClass('twelve');

		draw_player($winner, winner, false);
	} else {
		draw_all(-1);
	}
	$('.controls').append(render_control('next', "Next"));
}

function draw_all(index) {
	$('.controls').empty();
	$('.game .hands .hand')
		.removeClass('winner')
		.removeClass('twelve')
		.addClass('four')
		.removeClass('active')
		.fadeIn();

	while (window.game.round_in_progress) {
		window.game.next_player();
		let player = window.game.current_player; 
		let game = $('.game .hands');
		lscache.setBucket('templates');
		
		if ($('[data-name="'+player.name+'"]').length){
			draw_player($('[data-name="'+player.name+'"]'), player, true, 'four');
		}
		else {
			let template = lscache.get('hand');
			let $player = $(ejs.render(template, { hide: true, size: 'four', player: player }));
			$player.appendTo(game);
		}
	}
	if (!window.game.round_in_progress) {
		$('.hands .hand').each(function (){
			let player = get_player(this);
			draw_player(this, player, true);
		});
	}

	if (index > -1){
		$($('.hand')[index || 0]).addClass('select').addClass('active');
		$('.controls').append(render_control('play', "Play"));
	}
}

function draw_controls (player, force_next) {
	$('.controls').empty();

	if (force_next) {
		$('.controls').append(render_control('next', "Next"));
		return;
	}

	switch (player.state) {
		case Blackjack.PLAYER_STATES.BUST:
		case Blackjack.PLAYER_STATES.WIN:
		case Blackjack.PLAYER_STATES.STAY:
			$('.controls').append(render_control('next', "Next"));
			break;
		default:
			$('.controls').append(render_control('hit', "Hit"));
			$('.controls').append(render_control('stay', "Stay"));
			break;
	}
}

function draw_player (element, player, hide, size){
	let template = lscache.get('hand');
	let $player = $(ejs.render(template, { hide: (!!hide), size: (size || 'twelve'), player: player }));
	$(element).html($($player).html());
}

function reset_player (player) {
	player.previous_state = player.state;
	if ((player.state !== Blackjack.PLAYER_STATES.BUST) && (player.state !== Blackjack.PLAYER_STATES.WIN))
		player.state = Blackjack.PLAYER_STATES.NONE;
}

function set_score(player) {
	player.score++;
}

bind_control('play', function () {
	$('.hand.active .card').fadeIn()
	$(this).remove()
	$('.hands .hand').not('.active').fadeOut(function () {
		draw_controls(get_player($('.active')));
		$('.hand.active .pointer').fadeOut();
		$('.hand.active')
			.removeClass('select')
			.removeClass('four')
			.addClass('twelve');
		$('.hand.active .card').slice(1).each(function (){
			$(this).removeClass('back-side').addClass('front-side');
			flip_card(this);
		});
	});
	
});

bind_control('hit', function (){
	let player = get_player($('.hand.active'));
	player.state = Blackjack.PLAYER_STATES.HIT;
	window.game.process_play(player);
	draw_player('.hand.active', player);
	draw_controls(player, true);
	reset_player(player);
});

bind_control('stay', function () {
	let player = get_player($('.hand.active'));
	player.state = Blackjack.PLAYER_STATES.STAY;
	window.game.process_play(player);
	draw_player('.hand.active', player);
	draw_controls(player);
	reset_player(player);
});

bind_control('next', function (){
	if ($('.winner').length || window.no_winner) {
		window.no_winner = void(0);
		window.game.end_round();
		window.game.players.forEach((player) => player.state = Blackjack.PLAYER_STATES.NONE)	;
		window.game.start_round();
		window.turn_index = 0;
		draw_all(window.turn_index++);
		return;
	}
	if (window.turn_index >= window.game.players.length) {
		window.turn_index = 0;

		let remaining = !window.game.players.every(function (player) { 
			return (player.previous_state === Blackjack.PLAYER_STATES.STAY)||(player.previous_state === Blackjack.PLAYER_STATES.BUST);
		});

		let $remaining = (window.game.players.filter(function (player) {
			return (
				(player.previous_state !== Blackjack.PLAYER_STATES.BUST) &&
				(player.previous_state !== Blackjack.PLAYER_STATES.WIN) 
			);
		}).length);
		
		remaining = ($remaining > 1) && remaining;

		if (remaining) {
			draw_all(window.turn_index++);
		}
		else {
			let winner = window.game.winners[0];
			if (winner) {
				draw_winner(winner);
				set_score(winner);
			}
			else {
				window.no_winner = true;
				console.log('no winner')
			}
		}
	} else {
		//let player = get_player($('.active'));
		draw_all(window.turn_index++);	
	}
});

window.game.start_round();
draw_all(window.turn_index++);	

$(document).on({
	click: function () {
		let ace = $(this);
		ace = get_player($('.active')).hand.find((card) => card.id === parseInt($(this).attr('data-id')));
		if (ace instanceof Blackjack.Ace) {
			let new_val = ((ace.value === 1) && 11) || 1;
			ace.value = new_val;
		} else {
			throw new Error('tried to edit a non ace');
		}
		
		draw_player('.hand.active', get_player('.active'));
	}
}, '.active.twelve .card-0.front-side, .active.twelve .card-13.front-side, .active.twelve .card-26.front-side, .active.twelve .card-39.front-side');