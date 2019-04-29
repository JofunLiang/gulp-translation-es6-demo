# gulp + gulp-better-rollup + rollup 构建 ES6 开发环境

关于 [Gulp](https://www.gulpjs.com.cn/) 就不过多啰嗦了。常用的 js 模块打包工具主要有 [webpack](https://www.webpackjs.com/)、[rollup](https://www.rollupjs.com/guide/zh) 和 [browserify](http://browserify.org/) 三个，Gulp 构建 ES6 开发环境通常需要借助这三者之一来合并打包 ES6 模块代码。因此，Gulp 构建 ES6 开发环境的方案有很多，例如：webpack-stream、rollup-stream 、browserify等，本文讲述使用 [gulp-better-rollup](https://www.npmjs.com/package/gulp-better-rollup) 的构建过程。gulp-better-rollup 可以将 rollup 更深入地集成到Gulps管道链中。

## 构建基础的 ES6 语法转译环境

首先，安装 gulp 工具，命令如下：
```
$ npm install --save-dev gulp
```

安装 gulp-better-rollup 插件，由于 gulp-better-rollup 需要 rollup 作为依赖，因此，还要安装 rollup 模块和 rollup-plugin-babel（rollup 和 babel 之间的无缝集成插件）：
```
$ npm install --save-dev gulp-better-rollup rollup rollup-plugin-babel
```

安装 babel 核心插件:
```
$ npm install --save-dev @babel/core @babel/preset-env
```

安装完成后，配置 .babelrc 文件和 gulpfile.js文件，将这两个文件放在项目根目录下。

新建 .babelrc 配置文件如下：
```json
{
  "presets": [
    [
      "@babel/env",
      {
        "targets":{
          "browsers": "last 2 versions, > 1%, ie >= 9"
        },
        "modules": false
      }
    ]
  ]
}
```

新建 gulpfile.js 文件如下：
```js
const gulp = require("gulp");
const rollup = require("gulp-better-rollup");
const babel = require("rollup-plugin-babel");

gulp.task("babel", () => {
  return gulp.src("src/**/*.js")
    .pipe(rollup({
      plugins: [babel()]
    },{
      format: "iife"
    }))
    .pipe(gulp.dest("dist"))
})

gulp.task("watch", () => {
	gulp.watch("src/**/*.js", gulp.series("babel"))
})

gulp.task("default", gulp.series(["babel", "watch"]))
```

在 src 目录下使用 ES6 语法新建 js 文件，然后运行 gulp 默认任务，检查 dist 下的文件是否编译成功。

## 使用 ployfill 兼容

经过上面的构建过程，成功将 ES6 语法转译为 ES5 语法，但也仅仅是转换的语法，新的 api（如：Set、Map、Promise等） 并没有被转译。关于 ployfill 兼容可以直接在页面中引入 ployfill.js 或 ployfill.min.js 文件实现，这种方式比较简单，本文不再赘述，下面讲下在构建中的实现方式。

安装 @babel/plugin-transform-runtime 、@babel/runtime-corejs2 和 core-js@2（注意：core-js的版本要和@babel/runtime的版本对应，如：@babel/runtime-corejs2对应core-js@2）。@babel/plugin-transform-runtime 的作用主要是避免污染全局变量和编译输出中的重复。@babel/runtime（此处指@babel/runtime-corejs2）实现运行时编译到您的构建中。
```
$ npm install --save-dev @babel/plugin-transform-runtime @babel/runtime-corejs2 core-js@2
```

修改 .babelrc 文件：
```json
{
  "presets": [
    [
      "@babel/env",
      {
        "targets":{
          "browsers": "last 2 versions, > 1%, ie >= 9"
        },
        "modules": false
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime", {
        "corejs": 2
      }
    ]
  ]
}
```

同时修改 gulpfile.js 文件，给 rollup-plugin-babel 配置 runtimeHelpers 属性如下：
```js
const gulp = require("gulp");
const rollup = require("gulp-better-rollup");
const babel = require("rollup-plugin-babel");

gulp.task("babel", () => {
  return gulp.src("src/**/*.js")
    .pipe(rollup({
      plugins: [
        babel({
          runtimeHelpers: true
        })
      ]
    },{
      format: "iife"
    }))
    .pipe(gulp.dest("dist"))
})

gulp.task("watch", () => {
	gulp.watch("src/**/*.js", gulp.series("babel"))
})

gulp.task("default", gulp.series(["babel", "watch"]))
```

再安装 rollup-plugin-node-resolve 和 rollup-plugin-commonjs，这两个插件主要作用是注入 node_modules 下的基于 commonjs 模块标准的模块代码。在这里的作用主要是加载 ployfill 模块。
```
$ npm install --save-dev rollup-plugin-node-resolve rollup-plugin-commonjs
```

在修改 gulpfile.js 文件如下：
```js
const gulp = require("gulp");
const rollup = require("gulp-better-rollup");
const babel = require("rollup-plugin-babel");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");

gulp.task("babel", () => {
  return gulp.src("src/**/*.js")
    .pipe(rollup({
      plugins: [
        commonjs(),
        resolve(),
        babel({
          runtimeHelpers: true
        })
      ]
    },{
      format: "iife"
    }))
    .pipe(gulp.dest("dist"))
})

gulp.task("watch", () => {
	gulp.watch("src/**/*.js", gulp.series("babel"))
})

gulp.task("default", gulp.series(["babel", "watch"]))
```

## 使用 sourcemaps 和压缩

注意压缩使用 rollup-plugin-uglify 插件，为了提升打包速度，我们把模块文件放到 src/js/modules 文件夹下，将 gulp.src("src/js/\*.js") 改为 gulp.src("src/js/\*.js") 只打包主文件不打包依赖模块。

安装 gulp-sourcemaps 和 rollup-plugin-uglify 插件：
```
npm install --save-dev gulp-sourcemaps rollup-plugin-uglify
```

修改 gulpfile.js 文件如下：
```js
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
```
