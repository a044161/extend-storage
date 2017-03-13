'use strict';

var gulp = require('gulp');

var browserSync = require('browser-sync');
var bsCreate = browserSync.create();
var uglify = require('gulp-uglify');
var del = require('del');
var rename = require('gulp-rename');

gulp.task('default', function(){
    bsCreate.init({
        server:{
            baseDir: 'src',
            directory: true
        }
    });

    var watcher = gulp.watch(['*.html', 'views/**/*.html', 'styles/**/*.css', '**/*.js'],{cwd:'src'});
    watcher.on('all', function(event, path, stats){
        bsCreate.reload()
    })
});

gulp.task('dist', gulp.series(delDist, function(){
    return gulp.src('src/extend-storage/**/*.js')
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist'))
}));


function delDist (){
    return del('dist')
};