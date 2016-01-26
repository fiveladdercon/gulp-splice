var fs     = require('fs');
var path   = require('path');
var stream = require('stream');
var gutil  = require('gulp-util');

module.exports = function (opts) {
	if (!opts) throw new gutil.PluginError('gulp-splice', 'Missing options');

	if (typeof opts === 'object') {
		if (!opts.key) throw new gutil.PluginError('gulp-splice', 'Missing required key option');
	} else {
		opts = {key:opts};
	}

	var innerBuf;
	var outerBuf;
	var outerFile;

	return new stream.Transform({ objectMode: true, transform: read, flush : write});

	function read (file, encoding, next) {
		if (file.isNull()) {
			next(null,file);
		}  else if (file.isStream()) {
			next(new gutil.PluginError('gulp-splice','Streams not supported'));
		} else {
			if (!outerBuf && (file.contents.indexOf(opts.key)>=0) && (!opts.outer || (file.path.indexOf(opts.outer)>=0))) {
				outerFile = file.clone({contents:false});
				outerBuf  = new Buffer(file.contents);
				next();
			} else if (!opts.inner) {
				innerBuf = !innerBuf ? new Buffer(file.contents) : Buffer.concat([innerBuf,file.contents],innerBuf.length + file.contents.length);
				next();
			} else if (file.path.indexOf(opts.inner)>=0) {
				innerBuf = new Buffer(file.contents);
				next();
			} else {
				next(null,file);
			}
		}
	}

	function write (done) {
		var self = this;
		if (!innerBuf && !opts.inner) {
			done(new gutil.PluginError('gulp-splice','No inner file'));
		} else if (!outerBuf && !opts.outer) {
			done(new gutil.PluginError('gulp-splice','No outer file'));
		} else {
			if (!innerBuf) innerBuf = fs.readFileSync(opts.inner);
			if (!outerBuf) outerBuf = fs.readFileSync(opts.outer);
			if (!outerFile) {
				outerFile = new gutil.File();
				outerFile.path = path.isAbsolute(opts.outer) ? opts.outer :
								 path.normalize(path.join(process.cwd(), opts.outer));
			}
		    var index = outerBuf.indexOf(opts.key);
		    if (index<0) {
		    	done(new gutil.PluginError('gulp-splice','Key '+opts.key+' not found in '+path.basename(outerFile.path)));
		    } else {
				outerFile.contents = Buffer.concat([
							outerBuf.slice(0,index),
							innerBuf,
							outerBuf.slice(index + opts.key.length)
							], outerBuf.length - opts.key.length + innerBuf.length);
				self.push(outerFile);
				done();
			}
		}
	}

};