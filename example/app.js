var _ = require('lodash');
var path = require('path');
var app = require('koa')();
var render = require('koa-cheerio-template');
var autorouter = require('../'); // koa-autorouter

// for controllers simplicity
app.use(function *(next) {
  this.data = _.merge({}, this.request.body, this.query, this.params /* koa-resource-router ID */);
  yield next;
});

var options = {
  root: path.join(__dirname, 'views/'),
  bundles: 'public/bundles/',
  ext: '.html'
};

app.use(render(options));
app.use(autorouter(options));

app.listen(3000);
