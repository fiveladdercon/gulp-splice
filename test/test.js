var splice = require('../');
var path   = require('path');
var expect = require('chai').expect;
var File   = require('gulp-util').File;
var EOL    = require('os').EOL;

describe('gulp-splice', function () {

	// Pipe input utils

	function open() {
		var args = []; for(var i=0;i<arguments.length;i++) args[i] = arguments[i];
		return new File({
			path     : path.join(__dirname,args.shift()),
			contents : args.length ? new Buffer(args.join('')) : null
		});
	}

	var innerPipe = open('inner.txt','This is inner piped content.'+EOL);
	var outerPipe = open('outer.txt','This is outer piped content.'+EOL, 
		                             '<#key#>'                      ,  
		                             'This is outer piped content.'+EOL);
	var otherPipe = open('other.txt','This is other piped content.'+EOL);

	var innerLoad = path.join(__dirname,'inner.txt');
	var outerLoad = path.join(__dirname,'outer.txt');

	// Pipe output utils
	
	var files;

	function flush () {
		files = [];
	}

	function queue (file) {
		files.push(file); 
	}

	// Tests

	describe('when correctly used', function () {

		beforeEach(flush);

		it('splices the contents of one file into another at the key', function (done) {
			var stream  = splice('<#key#>');
			var spliced = open('outer.txt','This is outer piped content.'+EOL, 
				                           'This is inner piped content.'+EOL, 
				                           'This is outer piped content.'+EOL);
			stream.on('data',queue);
			stream.write(innerPipe);
			stream.write(outerPipe);
			stream.end(function () {
				expect(files.length).to.equal(1);
				expect(files[0].path).to.equal(spliced.path);
				expect(files[0].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('splices regardless of arrival order', function (done) {
			var stream  = splice('<#key#>');
			var spliced = open('outer.txt','This is outer piped content.'+EOL, 
				                           'This is inner piped content.'+EOL, 
				                           'This is outer piped content.'+EOL);
			stream.on('data',queue);
			stream.write(innerPipe);
			stream.write(outerPipe);
			stream.end(function () {
				expect(files.length).to.equal(1);
				expect(files[0].path).to.equal(spliced.path);
				expect(files[0].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('loads the outer file if it does not come through the pipe', function (done) {
			var stream  = splice({key: '<#key#>', outer: outerLoad});
			var spliced = open('outer.txt', 'This is outer loaded content.'+EOL,
				                            'This is inner piped content.' +EOL,
				                            'This is outer loaded content.'+EOL);
			stream.on('data',queue);
			stream.write(innerPipe);
			stream.end(function () {
				expect(files.length).to.equal(1);
				expect(files[0].path).to.equal(spliced.path);
				expect(files[0].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('loads the inner file if it does not come through the pipe', function (done) {
			var stream  = splice({key: '<#key#>', inner: innerLoad});
			var spliced = open('outer.txt', 'This is outer piped content.' +EOL,
				                            'This is inner loaded content.'+EOL,
				                            'This is outer piped content.' +EOL);
			stream.on('data',queue);
			stream.write(outerPipe);
			stream.end(function () {
				expect(files.length).to.equal(1);
				expect(files[0].path).to.equal(spliced.path);
				expect(files[0].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('loads both files if neither come through the pipe', function (done) {
			var stream  = splice({key: '<#key#>', outer:outerLoad, inner: innerLoad});
			var spliced = open('outer.txt', 'This is outer loaded content.'+EOL,
				                            'This is inner loaded content.'+EOL,
				                            'This is outer loaded content.'+EOL);
			stream.on('data',queue);
			stream.end(function () {
				expect(files.length).to.equal(1);
				expect(files[0].path).to.equal(spliced.path);
				expect(files[0].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('uses pipes over loads when specified AND also come through the pipe', function (done) {
			var stream  = splice({key: '<#key#>', outer:outerLoad, inner: innerLoad});
			var spliced = open('outer.txt', 'This is outer piped content.'+EOL,
				                            'This is inner piped content.'+EOL,
				                            'This is outer piped content.'+EOL);
			stream.on('data',queue);
			stream.write(innerPipe);
			stream.write(outerPipe);
			stream.end(function () {
				expect(files.length).to.equal(1);
				expect(files[0].path).to.equal(spliced.path);
				expect(files[0].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('concatinates non-outer files as the inner when no inner is specified', function (done) {
			var stream  = splice('<#key#>');
			var spliced = open('outer.txt','This is outer piped content.'+EOL, 
		    		                       'This is other piped content.'+EOL, 
		            		               'This is inner piped content.'+EOL, 
		                    		       'This is other piped content.'+EOL, 
		                            	   'This is outer piped content.'+EOL);
			stream.on('data',queue);
			stream.write(otherPipe);
			stream.write(innerPipe);
			stream.write(outerPipe);
			stream.write(otherPipe);
			stream.end(function () {
				expect(files.length).to.equal(1);
				expect(files[0].path).to.equal(spliced.path);
				expect(files[0].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('passes through files not involved in the splice when an inner is specified and piped in', function (done) {
			var stream  = splice({key: '<#key#>', inner:innerLoad});
			var spliced = open('outer.txt','This is outer piped content.'+EOL, 
		            		               'This is inner piped content.'+EOL, 
		                            	   'This is outer piped content.'+EOL);
			stream.on('data',queue);
			stream.write(otherPipe);
			stream.write(innerPipe);
			stream.write(outerPipe);
			stream.write(otherPipe);
			stream.end(function () {
				expect(files.length).to.equal(3);
				expect(files[0].path).to.equal(otherPipe.path);
				expect(files[0].contents.toString()).to.equal(otherPipe.contents.toString());
				expect(files[1].path).to.equal(otherPipe.path);
				expect(files[1].contents.toString()).to.equal(otherPipe.contents.toString());
				expect(files[2].path).to.equal(spliced.path);
				expect(files[2].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('passes through files not involved in the splice when an inner is specified and loaded in', function (done) {
			var stream  = splice({key: '<#key#>', inner:innerLoad});
			var spliced = open('outer.txt','This is outer piped content.' +EOL, 
		            		               'This is inner loaded content.'+EOL, 
		                            	   'This is outer piped content.' +EOL);
			stream.on('data',queue);
			stream.write(otherPipe);
			stream.write(outerPipe);
			stream.write(otherPipe);
			stream.end(function () {
				expect(files.length).to.equal(3);
				expect(files[0].path).to.equal(otherPipe.path);
				expect(files[0].contents.toString()).to.equal(otherPipe.contents.toString());
				expect(files[1].path).to.equal(otherPipe.path);
				expect(files[1].contents.toString()).to.equal(otherPipe.contents.toString());
				expect(files[2].path).to.equal(spliced.path);
				expect(files[2].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('passes through null files', function (done) {
			var stream    = splice('<#key#>');
			var emptyPipe = open('empty.txt');
			var spliced   = open('outer.txt','This is outer piped content.'+EOL, 
		    		                         'This is other piped content.'+EOL, 
		            	 	                 'This is inner piped content.'+EOL, 
		                      	  	         'This is other piped content.'+EOL, 
		                               	     'This is outer piped content.'+EOL);
			stream.on('data',queue);
			stream.write(otherPipe);
			stream.write(innerPipe);
			stream.write(emptyPipe);
			stream.write(outerPipe);
			stream.write(otherPipe);
			stream.end(function () {
				expect(files.length).to.equal(2);
				expect(files[0].path).to.equal(emptyPipe.path);
				expect(files[0].contents).to.equal(null);
				expect(files[1].path).to.equal(spliced.path);
				expect(files[1].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('treats only the first key matching file as the outer when no outer specified', function (done) {
			var stream     = splice('<#key#>');
			var secondPipe = open('second.txt','Another file with the <#key#>.'+EOL);
			var spliced    = open('outer.txt' ,'This is outer piped content.'  +EOL, 
				                               'Another file with the <#key#>.'+EOL, 
				                               'This is outer piped content.'  +EOL);
			stream.on('data',queue);
			stream.write(outerPipe);
			stream.write(secondPipe);
			stream.end(function () {
				expect(files.length).to.equal(1);
				expect(files[0].path).to.equal(spliced.path);
				expect(files[0].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('ignores keys in other files when the outer file is specified', function (done) {
			var stream     = splice({key:'<#key#>', outer:'outer.txt'});
			var secondPipe = open('second.txt','Another file with the <#key#>.'+EOL);
			var spliced    = open('outer.txt' ,'This is outer piped content.'  +EOL, 
				                               'Another file with the <#key#>.'+EOL, 
				                               'This is outer piped content.'  +EOL);
			stream.on('data',queue);
			stream.write(secondPipe);
			stream.write(outerPipe);
			stream.end(function () {
				expect(files.length).to.equal(1);
				expect(files[0].path).to.equal(spliced.path);
				expect(files[0].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

		it('only replaces the first instance of the key when multiply defined in the outer', function (done) {
			var stream     = splice('<#key#>');
			var dblkeyPipe = open('outer.txt','This is outer piped content.'+EOL,
				                              '<#key#>'                         ,
				                              '<#key#>'                     +EOL,
				                              'This is outer piped content.'+EOL);
			var spliced    = open('outer.txt','This is outer piped content.'+EOL, 
		            		                  'This is inner piped content.'+EOL, 
				                              '<#key#>'                     +EOL,
		                            	      'This is outer piped content.'+EOL);
			stream.on('data',queue);
			stream.write(innerPipe);
			stream.write(dblkeyPipe);
			stream.end(function () {
				expect(files.length).to.equal(1);
				expect(files[0].path).to.equal(spliced.path);
				expect(files[0].contents.toString()).to.equal(spliced.contents.toString());
				done();
			});
		});

	}); /* when correctly used */

	describe('when incorrectly used', function () {

		beforeEach(flush);

		it('throws an error if no options are passed', function () {
			expect(splice).to.throw('Missing options');
		});

		it('throws an error if no key is specified', function () {
			expect(function () { 
				splice({inner:innerLoad});
			}).to.throw('Missing required key option');
		});

		it('throws an error if there is no inner file piped or loaded', function () {
			var stream = splice('<#key#>');
			stream.on('data',queue);
			stream.write(outerPipe);
			expect(function () {
				stream.end();
			}).to.throw('No inner file');
		});

		it('throws an error if the loaded inner file doesn\'t load', function () {
			var stream = splice({key:'<#key#>',inner:'no.inner.txt'});
			stream.on('data',queue);
			stream.write(outerPipe);
			expect(function () {
				stream.end();
			}).to.throw(/no such file/);
		});

		it('throws an error if there is no outer file piped or loaded', function () {
			var stream = splice('<#key#>');
			stream.on('data',queue);
			stream.write(innerPipe);
			stream.write(otherPipe);
			expect(function () {
				stream.end();
			}).to.throw('No outer file');
		});

		it('throws an error if the loaded outer file doesn\'t load', function () {
			var stream = splice({key:'<#key#>',outer:'no.outer.txt'});
			stream.on('data',queue);
			stream.write(innerPipe);
			expect(function () {
				stream.end();
			}).to.throw(/no such file/);
		});

		it('throws an error if the loaded outer file doesn\'t contain a key', function () {
			var stream = splice({key:'<#key#>',outer:innerLoad});
			stream.on('data',queue);
			stream.write(innerPipe);
			expect(function () {
				stream.end();
			}).to.throw('Key <#key#> not found in inner.txt');
		});

	}); /* when incorrectly used */

});