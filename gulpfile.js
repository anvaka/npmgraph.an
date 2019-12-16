var gulp = require('gulp'),
    fs = require('fs'),
    gutil = require('gulp-util'),
    path = require('path'),
    argv = require('yargs')
       .alias('p', 'port')
       .alias('s', 'server')
       .argv;

var devServer = {
  port: argv.port || Math.round(31337 + Math.random() * 1000),
  server: argv.server || '0.0.0.0',
  livereload: 35000 + Math.round((Math.random() * 1000)),
  root: './dist'
};

gulp.task('runBrowserify', runBrowserify);
gulp.task('compileLess', compileLess);
gulp.task('makeDist', makeDist);
gulp.task('copyDist', copyDist);
gulp.task('watchChanges', watchChanges);
gulp.task('startStaticServer', startStaticServer);
gulp.task('build', gulp.series('makeDist', 'runBrowserify', 'copyDist', 'compileLess'));
gulp.task('default', gulp.series('build', 'startStaticServer', 'watchChanges'));

function runBrowserify(done) {
  produceMainBundle();
  produce3DBundle();
  done();
}

function produceMainBundle() {
  var bundle = require('browserify')()
    .exclude('renderer3d')
    .add('./src/scripts/index.js');

  bundle
    .bundle()
    .on('error', function (err) {
      gutil.log(gutil.colors.red('Failed to browserify'), gutil.colors.yellow(err.message));
    })
    .pipe(fs.createWriteStream(path.join(__dirname + '/dist/bundle.js')));
}

function produce3DBundle() {
  var bundle = require('browserify')()
    .require('./src/scripts/viewer/3d/renderer3d.js', { expose: 'renderer3d' });

  bundle
    .bundle()
    .on('error', function (err) {
      gutil.log(gutil.colors.red('Failed to browserify render3d'), gutil.colors.yellow(err.message));
    })
    .pipe(fs.createWriteStream(path.join(__dirname + '/dist/renderer3d.js')));

}

function compileLess(done) {
  var less = require('gulp-less')('src/styles');
  less.on('error', function (err) {
    gutil.log(gutil.colors.red('Failed to compile less: '), gutil.colors.yellow(err.message));
  });

	gulp.src('src/styles/main.less')
		.pipe(less)
		.pipe(gulp.dest('dist/styles'));
	done();
}

function makeDist(done) {
  // var fs = require('fs');
  if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
  }
  done();
}

function copyDist(done) {
  var concat = require('gulp-concat');

  gulp.src('./src/index.html').pipe(gulp.dest('./dist'));

  gulp.src([
      './node_modules/angular/angular.min.js',
      './src/external/angular-route.js'
    ])
    .pipe(concat('external.min.js'))
    .pipe(gulp.dest('./dist'));

  gulp.src([
    './node_modules/twitter-bootstrap-3.0.0/fonts/*'])
      .pipe(gulp.dest('./dist/fonts/'));
  done();
}

function watchChanges() {
  gulp.watch(['src/**/*.*', '!node_modules/**', '!src/*.html'], ['runBrowserify', 'copyDist']);
  gulp.watch('src/styles/*.less', ['compileLess']);
  gulp.watch(['src/*.html'], ['copyDist']);
  gulp.watch(['dist/**', '!dist/**/node_modules/**']).on('change', notifyLivereload);
}

var lr;
function startStaticServer() {
  var express = require('express');
  var app = express();
  app.use(require('connect-livereload')({port: devServer.livereload }));
  app.use(express.static(devServer.root));
  app.listen(devServer.port, devServer.server, function () {
    gutil.log("opened server on http://" + devServer.server + ":" + devServer.port);
  });

  lr = require('tiny-lr')();
  lr.listen(devServer.livereload);
}

function notifyLivereload(event) {
  var fileName = require('path').relative(devServer.root, event.path);
  lr.changed({ body: { files: [fileName] } });
}
