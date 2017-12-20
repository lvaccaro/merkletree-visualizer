'use strict';

const fs = require('fs');
const gulp = require('gulp');
const clean = require('gulp-clean');
const exec = require('gulp-exec');
const runSequence = require('run-sequence');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const pump = require('pump');

gulp.task('clean', () => {
  if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
  }
  return gulp.src('./dist/*', {read: false})
        .pipe(clean({force: true}));
});

gulp.task('compress', cb => {
  pump([
    gulp.src('./dist/bower-opentimestamps.js'),
    uglify(),
    rename('lib.min.js'),
    gulp.dest('./dist/')
  ],
        cb
    );
});

gulp.task('index', () => {
  const options = {
    continueOnError: false, // default = false, true means don't emit error event
    pipeStdout: false, // default = false, true means stdout is written to file.contents
    customTemplatingThing: 'test' // content passed to gutil.template()
  };
  const reportOptions = {
    err: true, // default = true, false means don't write err
    stderr: true, // default = true, false means don't write stderr
    stdout: true // default = true, false means don't write stdout
  };
  return gulp.src('./')
        .pipe(exec('./node_modules/browserify/bin/cmd.js -r javascript-opentimestamps ./src/index.js -o ./dist/lib.es6.js', options))
        .pipe(exec('./node_modules/babel-cli/bin/babel.js ./dist/lib.es6.js -o ./dist/lib.js', options))
        .pipe(exec.reporter(reportOptions));

    /* NOTE: babelify run babel with .babelrc file, but doesn't convert the code
    gulp.task('index', function() {
        return browserify({ debug: true, entries: [" bower-opentimestamps.es6.js"] })
            .transform(babelify)
            .bundle()
            .pipe(source(' bower-opentimestamps.js'))
            .pipe(gulp.dest('./'));
    }); */
});

gulp.task('default', done => {
  runSequence('clean', 'index', 'compress', () => {
    done();
  });
});
