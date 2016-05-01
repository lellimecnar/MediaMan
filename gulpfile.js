var gulp = require('gulp'),
	Path = require('path'),
	gutil = require('gulp-util'),
	File = gutil.File,
	lz = require('lz-string'),

	PATHS = {
		ROOT: __dirname,
		BUILD: Path.join(__dirname, 'build'),
		SRC: Path.join(__dirname, 'src')
	};

PATHS.PUB = Path.join(PATHS.BUILD, 'pub');
PATHS.API = Path.join(PATHS.BUILD, 'api');

gulp.task('build:js', function(done) {
	var sourcemaps = require('gulp-sourcemaps');

	return gulp.src([
		'**/*.js',
		'!Res.js'
	], {
		cwd: PATHS.SRC
	})
		.pipe(sourcemaps.init())
		.pipe(require('gulp-babel')())
		.pipe(require('gulp-uglify')())
		.pipe(sourcemaps.write())
		.pipe(require('through2').obj((file, enc, cb) => {
			var imports = file.babel.modules.imports.map((imp) => {
				return imp.source;
			});
			cb(null, new File({
				path: Path.relative(file.cwd, file.path),
				contents: new Buffer(JSON.stringify({
					imports,
					contents: lz.compressToUTF16(file.contents.toString(enc))
				}))
			}));
		}))
		.pipe(gulp.dest(PATHS.PUB))
		.pipe(require('gulp-debug')());
});

gulp.task('build:html', function(done) {
	var tagRegex = /\<!--\s*##\s*([^ #]+)\s*##\s*--\>/gm,
		sourcemaps = require('gulp-sourcemaps'),
		gIf = require('gulp-if');

	return gulp.src('**/*.html', {
		cwd: PATHS.SRC
	})
		.pipe(require('through2').obj((file, enc, cb) => {
			var contents = file.contents.toString(enc),
				deps = [];

			require('async').each(contents.match(tagRegex), (tag, next) => {
				var src = tag.replace(tagRegex, '$1'),
					dirname = Path.dirname(file.path),
					path = Path.resolve(dirname, src),
					buildPipe,
					minPipe,
					elem;

				if (deps.indexOf(path) >= 0)
					return next();

				switch(Path.extname(path)) {
					case '.js':
						buildPipe = require('gulp-babel')();
						minPipe = require('gulp-uglify')();
						elem = function(p, b64) {
							return `
								<script
									type="text/javascript"
									id="___${p.replace(/[^a-z]+/gi, '_')}___"
									src="data:text/javascript;base64,${b64}">
								</script>
							`;
						}
						break;
				}

				require('vinyl-fs').src(src, {
					cwd: dirname
				})
					.pipe(sourcemaps.init())
					.pipe(gIf(!!buildPipe, buildPipe))
					.pipe(gIf(!!minPipe, minPipe))
					.pipe(sourcemaps.write())
					.pipe(gIf(!!elem, require('through2').obj((f, e, c) => {

						switch(f.basename) {
							case 'Res.js':
								f.contents = new Buffer(
									`${f.contents.toString(e)};window.Res=window.Res.default;`
								);
								break;
						}

						contents = contents.replace(tag,
								elem(
									Path.relative(f.cwd, f.path),
									f.contents.toString('base64')
								).replace(/[\s]+/g, ' ').trim()
							);

						next();
					})));
			}, (err) => {
				file.contents = new Buffer(contents);
				cb(err, file);
			});
		}))
		.pipe(gulp.dest(PATHS.PUB))
		.pipe(require('gulp-debug')())
});

gulp.task('build:api', function(done) {
	return gulp.src([
		'**/*.js'
	], {
		cwd: Path.join(PATHS.ROOT, 'api')
	})
		.pipe(require('gulp-babel')())
		.pipe(gulp.dest(PATHS.API))
		.pipe(require('gulp-debug')());
});

gulp.task('build', gulp.parallel('build:js', 'build:html', 'build:api'));
