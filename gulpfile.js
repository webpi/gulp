const { src, dest, lastRun, watch, series, parallel } = require('gulp');

const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require("autoprefixer");
const fileinclude = require('gulp-file-include');
const cleanCSS = require('gulp-clean-css');
const browserSync = require('browser-sync').create();

// 경로
const path = {
    scss: "src/scss/**/*.scss",
    html: "src/**/*.html",
    js: "src/assets/js/**/*.*",
    img: "src/assets/img/**/*.*"
    // fonts: "src/assets/fonts/**/*.*"
};

// 임시
const tmp = {
    html: "tmp",
    css: "tmp/assets/css",
    js: "tmp/assets/js",
    img: "tmp/assets/img"
    // fonts: "tmp/assets/fonts"
};

// build
const result = {
    html: "dist",
    css: "dist/assets/css",
    js: "dist/assets/js",
    img: "dist/assets/img"
    // fonts: "dist/resources/fonts"
};

function htmlDevTask(){
    return src(path.html, { since: lastRun(htmlDevTask) })
    // .pipe(fileinclude({
    //     prefix: '@@',
    //     basepath: '@file'
    // }))
    .pipe(dest(tmp.html));
}

function htmlBuildTask(){
    return src(path.html)
    .pipe(fileinclude({
        prefix: '@@',
        basepath: '@file'
    }))
    .pipe(dest(result.html));
}

function scssDevTask(){
    return src(path.scss, { sourcemaps: true }, { since: lastRun(scssDevTask) })
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))      
    .pipe(dest(tmp.css, { sourcemaps: './maps' }));
}

function scssBuildTask(){
    return src(path.scss, { sourcemaps: false })
    .pipe(sass())
    .pipe(cleanCSS({debug: true}, (details) => {
        console.log(`original ${details.name}: ${details.stats.originalSize}`);
        console.log(`minified ${details.name}: ${details.stats.minifiedSize}`);
    }))
    .pipe(postcss([autoprefixer()]))      
    .pipe(dest(result.css));
}

function concatJsTask(){
    return src(path.js, { since: lastRun(concatJsTask) })
    // .pipe(concat('scripts.js'))
    .pipe(dest(tmp.js));
}

function concatBuildJsTask(){
    return src(path.js)
    .pipe(dest(result.js));
}

function imageminTask(){
    return src(path.img)
    .pipe(dest(tmp.img));
}

function imageminBuildTask(){
    return src(path.img)
    .pipe(dest(result.img));
}

function browserSyncServe(cb){
    browserSync.init({
        ui: {
            port: 7000,
        },
        port: 7001,
        server: {
            baseDir: './tmp'
        }
    });

    cb();
}

function browserSyncReload(cb){
    browserSync.reload();

    cb();
}

function watchTask(){
    watch(path.html, series(htmlDevTask, browserSyncReload));
    watch(path.scss, series(scssDevTask, browserSyncReload));
    watch(path.js, series(concatJsTask, browserSyncReload));
    watch(path.img, series(imageminTask, browserSyncReload));
}

exports.default = series(
    htmlDevTask, 
    scssDevTask,
    imageminTask,
    concatJsTask, 
    browserSyncServe, 
    watchTask
);

exports.build = series(
    htmlBuildTask, 
    scssBuildTask,
    concatBuildJsTask,
    imageminBuildTask
);