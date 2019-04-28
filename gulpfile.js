const gulp = require("gulp");
const rollup = require("gulp-better-rollup");
const babel = require("rollup-plugin-babel");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const uglify = require("rollup-plugin-uglify");
const sourcemaps = require("gulp-sourcemaps");

gulp.task("babel", () => {
  return gulp.src("src/js/*.js")
    .pipe(sourcemaps.init())
    .pipe(rollup({
      plugins: [
        commonjs(),
        resolve(),
        babel({
          runtimeHelpers: true
        }),
        uglify.uglify()
      ]
    },{
      format: "iife"
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest("dist/js"))
})

gulp.task("watch", () => {
	gulp.watch("src/**/*.js", gulp.series("babel"))
})

gulp.task("default", gulp.series(["babel", "watch"]))