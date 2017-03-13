'use strict';

var gulp = require('gulp');

var browserSync = require('browser-sync');
var bsCreate = browserSync.create();
var uglify = require('gulp-uglify');

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

gulp.task('dist', function(){
    gulp.src('src/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist'))
})