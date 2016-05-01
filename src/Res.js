const LS_PREFIX = 'res:';
const LS_V_KEY = 'res:versions';

var _versions = localStorage.getItem(LS_V_KEY) || {};

function createElem(id, type, data) {
	var elem;

	switch(type) {
		case 'js':
			elem = document.createElement('script');
			elem.setAttribute('type', 'text/javascript');
			elem.setAttribute('src', [
				'data:text/javascript',
				`base64,${btoa(LZString.decompressFromUTF16(data.contents))}`
			].join(';'));
			break;
	}

	if (elem) {
		elem.setAttribute('id', id);
	}

	document.head.appendChild(elem);

	return elem;
}

export default class Res {
	static load(path, type, fn) {
		switch(arguments.length) {
			case 2:
				if (typeof type == 'function') {
					fn = type;
					type = null;
				}
				break;
		}

		if (typeof type !== 'string') {
			var m = path.match(/^\/?([^\/]+)\//) || path.match(/\.([a-z]+)$/);

			type = m ? m[1] : 'js';
			if (!m) path = `${path}.${type}`;
		}

		path = path.replace(new RegExp(`^\\/?(.+?)\\.?(?:${type})?$`), `/$1.${type}`);

		var lsKey = LS_PREFIX + path,
			id = path.toLowerCase().replace(/[^a-z]+/g, '_'),
			elem = document.getElementById(id);

		if (!elem) {
			var cached = localStorage.getItem(lsKey);

			if (cached) {
				return new Promise((resolve, reject) => {
					var data = JSON.parse(cached);
					createElem(id, type, data);
					resolve({
						path, type, data
					});
				});
			} else {
				return new Promise((resolve, reject) => {
					fetch(path)
						.then((res) => {
							return res.json();
						})
						.then((data) => {
							localStorage.setItem(lsKey, JSON.stringify(data));
							createElem(id, type, data);
							resolve({
								path, type, data
							});
						});
				});

				return ret;
			}
		}

	}

	constructor() {

	}
}
