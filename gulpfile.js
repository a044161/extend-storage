'use strict';

var gulp = require('gulp');

var browserSync = require('browser-sync');
var bsCreate = browserSync.create();

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
})