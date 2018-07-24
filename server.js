const express = require('express');

let app = express();

app.use('/', express.static(`${__dirname}/htdocs`));
app.use('/data', express.static(`${__dirname}/data`));
app.use('/lib/blackjack.js', express.static(`${__dirname}/blackjack.js`));
app.use('/lib/jquery.min.js', express.static(`${__dirname}/node_modules/jquery/dist/jquery.min.js`));
app.use('/lib/chance.min.js', express.static(`${__dirname}/node_modules/chance/dist/chance.min.js`));

let port = Number(process.env.PORT) || 8000;

app.listen(port, (err) => {
	if (!err)
		console.log(`listening on ${port}`);
	else {
		console.error(err.stack);
		process.exit(1);
	}
});