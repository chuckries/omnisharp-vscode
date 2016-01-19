var gulp = require('gulp');
var decompress = require('gulp-decompress');
var tslint = require("gulp-tslint");
var es = require('event-stream');
var GitHub = require('github-releases');
var tmp = require('tmp');
var vfs = require('vinyl-fs');
var del = require('del');
var fs = require('fs');
var path = require('path');

tmp.setGracefulCleanup();

function downloadOmnisharp(version) {  
	var result = es.through();

	function onError(err) {
		result.emit('error', err);
	}

	var repo = new GitHub({
		repo: 'OmniSharp/omnisharp-roslyn',
		token: process.env['GITHUB_TOKEN']
	});

	repo.getReleases({ tag_name: version }, function (err, releases) {
		if (err) { return onError(err); }
		if (!releases.length) { return onError(new Error('Release not found')); }
		if (!releases[0].assets.length) { return onError(new Error('Assets not found')); }
        
        var asset;
        
        for (var i = 0; i < releases.length; i++) {
            var r = releases[i];
            
            for (var j = 0; j < r.assets.length; j++) {
                if (r.assets[j].name.indexOf('omnisharp-clr-win-x86') >= 0)
                {
                    asset = r.assets[j];
                }
            }
        }
        
        console.info('downloading', asset.name, version, '...')

		repo.downloadAsset(asset, function (err, istream) {
			if (err) { return onError(err); }
            
			tmp.file(function (err, tmpPath, fd, cleanupCallback) {
				if (err) { return onError(err); }

				var ostream = fs.createWriteStream(null, { fd: fd });
				ostream.once('error', onError);
				istream.once('error', onError);
				ostream.once('finish', function () {
					vfs.src(tmpPath).pipe(result);
				});
				istream.pipe(ostream);
			});
		});
	});

	return result;
}

gulp.task('omnisharp:clean', function () {
	return del('bin');
});

gulp.task('omnisharp:fetch', ['omnisharp:clean'], function () {
	return downloadOmnisharp('v1.7.0')
		.pipe(decompress())
		.pipe(gulp.dest('bin'));
});

var allTypeScript = [
    'src/**/*.ts',
    '!**/*.d.ts',
    '!**/typings**'
];

var lintReporter = function (output, file, options) {
	//emits: src/helloWorld.c:5:3: warning: implicit declaration of function ‘prinft’
	var relativeBase = file.base.substring(file.cwd.length + 1).replace('\\', '/');
	output.forEach(function(e) {
		var message = relativeBase + e.name + ':' + (e.startPosition.line + 1) + ':' + (e.startPosition.character + 1) + ': ' + e.failure;
		console.log('[tslint] ' + message);
	});
};

gulp.task('tslint', function () {
	gulp.src(allTypeScript)
	.pipe(tslint({
		rulesDirectory: "node_modules/tslint-microsoft-contrib"
	}))
	.pipe(tslint.report(lintReporter, {
		summarizeFailureOutput: false,
		emitError: false
	}))
});

gulp.task('omnisharp', ['omnisharp:fetch']);
