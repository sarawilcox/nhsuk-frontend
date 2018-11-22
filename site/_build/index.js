var path = require('path')

var Metalsmith = require('metalsmith')
var nunjucks = require('nunjucks')
var inplace = require('metalsmith-in-place')
var rename = require('metalsmith-rename')

var usage = require('./usage.js')
var breadcrumbs = require('./breadcrumbs.js')

var env = nunjucks.configure(['site/_layouts', 'packages'], { autoescape: true });
var rootDir = path.resolve(__dirname, '../..')

/**
 * engineOptions for the in-place nunjucks compiler
 */
var engineOptions = {
  path: ['site/_layouts', 'packages'],
  globals: {
    baseUrl: process.env.BASE_URL ? process.env.BASE_URL : '',
    usage: function(usageFile) {
      return usage(env, 'code-snippet.njk')(usageFile)
    },
  }
}

/**
module.exports.componentExamples = function(done) {
  Metalsmith(rootDir)
    .source('components')
    .destination('dist/docs/components')
    .clean(false)
    .use(function(files, metalsmith, done) {
      // take README.md files from components and rename them.
    })
}
**/

/**
 * Take the contents of ./docs/ and convert it into html.
 * Docs are written for native readability on github.com, so we
 * have to apply some workarounds.
 *
 * - Convert README.md into index pages
 * - Replace .md links in markdown with .html links
 * - Wrap markdown in the site-specific layout
 */
module.exports.markdownDocs = function(done) {
  Metalsmith(rootDir)
    .source('docs')
    .destination('dist/docs/docs')
    .clean(false)
    .use(rename([
      // README.md should end up being the index.html page
      [/\/README.md$/, '/index.md'],
      ['README.md', 'index.md'],
    ]))
    .use(function(files, metalsmith, done) {
      // For all files, replace markdown links with .html equivalents
      Object.keys(files).forEach(function(key) {
        var contents = files[key].contents.toString()
        var regex = /\[([^\]]*?)\]\(([^\)]*?)\.md\)/g
        contents = contents.replace(regex, function(match, p1, p2) {
          return `[${p1}](${p2}.html)`;
        })
        files[key].contents = new Buffer(contents)
      })
      done()
    })
    .use(inplace()) // convert markdown files to .html
    .use(function(files, metalsmith, done) {
      // Wrap markdown with the page.njk layout
      var keys = Object.keys(files)
      keys = keys.filter(function(key) {
        return key.endsWith('.html')
      })
      keys.map(function(key) {
        var contents = files[key].contents.toString('utf8')
        contents = `{% extends "page.njk" %}
          {% block content %}
            {%raw%}${contents}{%endraw%}
          {% endblock %}
        `
        files[key].contents = new Buffer(contents)
      })
      done()
    })
    .use(breadcrumbs({
      // Add a "Home" and a "Docs" breadcrumb
      baseFilepath: 'home/docs',
    }))
    .use(rename([
      // use the .njk extension so that inplace can do nunjucks processing
      [/\.html$/, '.njk'],
    ]))
    .use(inplace({
      engineOptions: engineOptions,
    }))
    .build(function(err) {
      if (err) throw err
      done()
    })
}

/**
 * Convert nunjuck pages from ./site/pages into html
 */
module.exports.buildSite = function(done) {
  Metalsmith(rootDir)
    .source('site/pages')
    .destination('dist/docs')
    .clean(false)
    .use(inplace({
      engineOptions: engineOptions,
    }))
    .build(function(err) {
      if (err) throw err
      done()
    })
}
