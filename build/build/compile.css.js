const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat')
const rename = require("gulp-rename");
const autoprefixer = require('gulp-autoprefixer');
const util = require('../util')

async function createFile(fileName, path, config, resolve, reject) {
  gulp.src(path)
    .pipe(autoprefixer({
      browsers: ['last 2 versions', 'Android >= 4.0'],
      cascade: true, //是否美化属性值 默认：true 像这样：
      remove: true //是否去掉不必要的前缀 默认：true
    }))
    .pipe(concat(fileName + '.dev.css'))
    .pipe(gulp.dest(config.distDirPath))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(rename(fileName + '.css'))
    .pipe(gulp.dest(config.distDirPath))
    .on('error', async(err) => {
      util.log('【css】compile complete error', 'debug')
      return await Promise.reject()
    })
    .on('end', async() => {
      util.log('【css ' + fileName + '】compile complete', 'debug')
      return await Promise.resolve()
    })
}


async function compileCSS(config) {
  const cssNames = []
  config.externalFiles.cssName.forEach(function(url) {
    cssNames.push(util.joinPath(config.templateDirPath, url))
  })
  let sucCount = 2
  let failCount = 2
  const success = async function() {
    if (sucCount === 1) {
      return await Promise.resolve()
    }
    sucCount--
  }
  const fail = async function() {
    if (failCount === 1) {
      return await Promise.reject()
    }
    failCount--
  }
  createFile('xxtppt', cssNames, config, success, fail)
  createFile('font', [util.joinPath(config.templateDirPath, config.externalFiles.fontName.join(''))], config, success, fail)
}


module.exports = compileCSS
