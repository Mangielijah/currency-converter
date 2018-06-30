const gulp = require('gulp');
const connect = require('gulp-connect');

gulp.task('webserver', function(){
	connect.server({
		root: './',
		port: 5050,
		livereload: true
	});
});

gulp.task('html', function () {
  gulp.src('./*.html')
    .pipe(connect.reload());
});
gulp.task('css', function () {
  gulp.src('./css/*.css')
    .pipe(connect.reload());
});
gulp.task('js', function () {
  gulp.src('./js/app.js')
    .pipe(connect.reload());
});

gulp.task('watch', function () {
  gulp.watch(['./*.html'], ['html']);
  gulp.watch(['./css/*.css'], ['css']);
  gulp.watch(['./js/app.js'], ['js']);
});

gulp.task('default', ['webserver', 'watch']);