const express = require('express');

let app = express();

app.use('/', express.static(`${__dirname}/htdocs`));

let port = Number(process.env.PORT) || 8000;

app.listen(port, (err) => {
	if (!err)
		console.log(`listening on ${port}`);
	else {
		console.error(err.stack);
		process.exit(1);
	}
});