const path = require('path')
const es = require('event-stream')
const del = require('del')
const gulp = require('gulp')
const compass = require('gulp-compass')
const autoprefixer = require('gulp-autoprefixer')
const shell = require('gulp-shell')
const inlineCss = require('gulp-inline-css')
const data = require('gulp-data')
const handlebars = require('gulp-compile-handlebars')
const rename = require('gulp-rename')
const plumber = require('gulp-plumber')
const notify = require('gulp-notify')
const htmlmin = require('gulp-htmlmin')

const dirs = {
  src: './src',
  i18n: './src/i18n',
  partials: './src/partials',
  styles: './src/styles',
  templates: './src/templates',
  dest: './dist',
  build: './build'
}

const plumberErrorHandler = {
  errorHandler: notify.onError({
    message: "Error: <%= error.message %>"
  })
}

const langs = ['zh-CN', 'en-US']

const genHbs = function (lang) {
  const options = {
    batch: [dirs.partials],
  }
  return gulp.src([dirs.templates + '/*.hbs'])
    .pipe(plumber(plumberErrorHandler))
    .pipe(data(function (file) {
      return require(`${dirs.i18n}/${path.basename(file.path, '.hbs')}/${lang}.json`)
    }))
    .pipe(handlebars(data, options))
    .pipe(rename(function (path) {
      path.basename += `_${lang}`
    }))
    .pipe(gulp.dest(dirs.dest))
}

gulp.task('hbs', function () {
  es.merge(langs.map(genHbs))
})

gulp.task('html', function () {
  gulp.src([dirs.dest + '/*.hbs'])
    .pipe(inlineCss({
      removeStyleTags: false,
    }))
    .pipe(rename(function (path) {
      path.extname = ".html"
    }))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(dirs.build))
    .pipe(notify('build successful'))
})

gulp.task('styles', function () {
  gulp.src([dirs.styles + '/**/*.scss'], {
    base: dirs.styles,
  })
  .pipe(plumber(plumberErrorHandler))
  .pipe(compass({
    css: dirs.dest,
    sass: dirs.styles,
  }))
  .pipe(autoprefixer())
  .pipe(gulp.dest(dirs.dest))
})

gulp.task('clean', function () {
  del([dirs.dest, dirs.build], {
    force: true
  })
})

gulp.task('watch', function () {
  gulp.watch([dirs.src + '/**/*'], ['build'])
})

gulp.task('build', shell.task([
  'gulp styles',
  'gulp hbs',
  'gulp html',
]))
