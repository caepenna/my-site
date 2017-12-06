var autoprefixer = require('gulp-autoprefixer');
var beeper = require('beeper');
var browserSync = require('browser-sync');
var cache = require('gulp-cache');
var cleanCSS = require('gulp-clean-css');
var gconcat = require('gulp-concat');
var gulp = require('gulp');
var gutil = require('gulp-util');
var imagemin = require('gulp-imagemin');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var pug = require('gulp-pug');
var rename = require("gulp-rename");
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var jsVendorFiles = [];
var myJsFiles = ['js/*.js'];
var fs = require('fs');
var bowerDirectory = getBowerDirectory();
var onError = function(err) {
    notify.onError({
      title:    "Gulp error in " + err.plugin,
      message:  err.toString()
    })(err);
    beeper(3);
    this.emit('end');
    gutil.log(gutil.colors.red(err));
};

function getBowerDirectory() {
  var bowerComponents = "./bower_components";
  if(fs.existsSync('.bowerrc')) {
    var bowerrc = JSON.parse(fs.readFileSync('.bowerrc').toString());
    return bowerrc.directory;
  } else if (fs.existsSync(bowerComponents)) {
    return bowerComponents + '/';
  } else {
    return '';
  }
}

function findKeyText(data, txt) {
  for (var i = 0; i < data.length; i++) {
    if(data[i].indexOf(txt) > -1) {
      return true;
    }
  }
  return false;
}

gulp.task('styles', function() {
  gulp.src('styles/*.sass')
  .pipe(plumber({ errorHandler: onError }))
  .pipe(sourcemaps.init())
  .pipe(sass({indentedSyntax: true}))
  .pipe(autoprefixer({
    browsers: ['last 5 versions'],
    cascade: false}))
  .pipe(cleanCSS())
  .pipe(sourcemaps.write())
  .pipe(rename({ suffix: '.min'}))
  .pipe(gulp.dest('build/css'));
});

gulp.task('templates', function() {
  gulp.src('./*.pug')
  .pipe(plumber({ errorHandler: onError }))
  .pipe(pug())
  .pipe(gulp.dest('build/'));
});

gulp.task('scripts', function() {
  return gulp.src(myJsFiles.concat(jsVendorFiles))
  .pipe(plumber({ errorHandler: onError }))
  .pipe(sourcemaps.init())
  .pipe(gconcat('bundle.js'))
  .pipe(uglify())
  .pipe(sourcemaps.write())
  .pipe(rename({ suffix: '.min'}))
  .pipe(gulp.dest('build/js'));
});

gulp.task('images', function() {
  gulp.src('img/**/*')
  .pipe(cache(imagemin({
    optimizationLevel: 3,
    progressive: true,
    interlaced: true})))
  .pipe(gulp.dest('build/img/'));
});

gulp.task('setup-src', function() {
  var data = fs.readFileSync('./index.pug').toString().split("\n");

  if(data[data.length - 1] === '') {
    data.pop();
  }

  if(data[data.length - 1].indexOf('script(src="js/bundle.min.js")') > -1) {
    data.pop();
  }

  if(!findKeyText(data, 'bundle.min.js')) {
    data.splice(data.length, 0, '    script(src="js/bundle.min.js") ');
  }

  var text = data.join("\n");
  fs.writeFile('./index.pug', text, function (err) {
    if (err) throw err;
  });
});

gulp.task('default', function() {
  console.log("Use 'gulp setup' command to initialize the project files");
});

gulp.task('setup', function() {
  gulp.start('styles', 'templates', 'scripts', 'images', 'setup-src');
});

gulp.task('watch', function() {
  gulp.watch('styles/**/*', ['styles']);
  gulp.watch(['templates/**/*', './*.pug'], ['templates']);
  gulp.watch('js/*.js', ['scripts']);
  gulp.watch('img/**/*', ['images']);

  browserSync.init({
    server: {
      proxy: "local.build",
      baseDir: "build/"
    }
  });

  gulp.watch(['build/**'], browserSync.reload);
});
