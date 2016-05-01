import Express from 'express';
import load from 'express-decorators/load';

var App = new Express(),
	ApiRouter = new Express.Router();

load(ApiRouter, {
	dirname: __dirname,
	filter: /\.ctrl\.js$/
});

App.use('/', Express.static('./build/pub'));
App.use('/api', ApiRouter);

App.listen(3030, 'localhost', function() {
	let {address, port} = this.address();
	console.log(`Listening at http://${address}:${port}`);
});
