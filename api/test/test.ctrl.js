import {
	controller,
	get
} from 'express-decorators';

@controller('/test')
export default class Test {
	@get('/')
	index(req, res) {
		res.json({
			msg: 'it works...'
		});
	}
}
