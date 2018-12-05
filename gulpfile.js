var gulp = require("gulp");
var imageResize = require("gulp-image-resize");
var rename = require("gulp-rename");

gulp.task("sm", function() {
  gulp
    .src("img/**/*.{jpg,png}")
    .pipe(
      imageResize({
        width: 360
      })
    )
    .pipe(
      rename(function(path) {
        path.basename += "-sm";
      })
    )
    .pipe(gulp.dest("images/"));
});

gulp.task("md", function() {
  gulp
    .src("img/**/*.{jpg,png}")
    .pipe(
      imageResize({
        width: 500
      })
    )
    .pipe(
      rename(function(path) {
        path.basename += "-md";
      })
    )
    .pipe(gulp.dest("images/"));
});

gulp.task("lg", function() {
  gulp
    .src("img/**/*.{jpg,png}")
    .pipe(
      imageResize({
        width: 800
      })
    )
    .pipe(
      rename(function(path) {
        path.basename += "-lg";
      })
    )
    .pipe(gulp.dest("images/"));
});
gulp.task("default", ["sm", "md", "lg"]);
