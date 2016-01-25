var fs      = require('fs');
var path    = require('path');
var gutil   = require('gulp-util');
var through = require('through2').obj;

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

	return through(read,write);

	function read (file, enc, cb) {
		if (file.isNull()) {
			cb(null,file);
		}  else if (file.isStream()) {
			cb(new gutil.PluginError('gulp-splice','Streams not supported'));
		} else {
			if (!outerBuf && (file.contents.indexOf(opts.key)>=0) && (!opts.outer || (file.path.indexOf(opts.outer)>=0))) {
				outerFile = file.clone({contents:false});
				outerBuf  = new Buffer(file.contents);
				cb();
			} else if (!opts.inner) {
				innerBuf = !innerBuf ? new Buffer(file.contents) : Buffer.concat([innerBuf,file.contents],innerBuf.length + file.contents.length);
				cb();
			} else if (file.path.indexOf(opts.inner)>=0) {
				innerBuf = new Buffer(file.contents);
				cb();
			} else {
				cb(null,file);
			}
		}
	}

	function write (cb) {
		var self = this;
		if (!innerBuf && !opts.inner) {
			cb(new gutil.PluginError('gulp-splice','No inner file'));
		} else if (!outerBuf && !opts.outer) {
			cb(new gutil.PluginError('gulp-splice','No outer file'));
		} else {
			if (!innerBuf)  innerBuf  = fs.readFileSync(opts.inner);
			if (!outerBuf)  outerBuf  = fs.readFileSync(opts.outer);
			if (!outerFile) outerFile = new gutil.File({path : path.join(process.cwd(), opts.outer)});
		    var index = outerBuf.indexOf(opts.key);
		    if (index<0) {
		    	cb(new gutil.PluginError('gulp-splice','Key '+opts.key+' not found in '+opts.outer || path.basename(outerFile.path)))
		    } else {
				outerFile.contents = Buffer.concat([
							outerBuf.slice(0,index),
							innerBuf,
							outerBuf.slice(index + opts.key.length)
							], outerBuf.length - opts.key.length + innerBuf.length);
				self.push(outerFile);
				cb();
			}
		}
	}

};