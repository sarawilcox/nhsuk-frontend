var nunjucks = require('nunjucks');
var pretty = require('pretty');

function usage(env, template) {
  return function(usageFile) {
    var html = env.render(usageFile, {})
    html = pretty(html, {ocd: true})
    var raw = env.getTemplate(usageFile).tmplStr
    //read the file plain

    var str = env.render(template, {
      html: html,
      raw: raw,
      filepath: usageFile,
    })
    return new nunjucks.runtime.SafeString(str)
  }
}

module.exports = usage
