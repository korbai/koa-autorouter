# koa-autorouter

Simple autorouter middleware based on [KOA-ROUTER](https://www.npmjs.com/package/koa-router).

# Features
- route is based on directory structure of controller
- controllers and view in the same directory
- set name for view render
- support simple views without controller

# Installation
```
npm install koa-autorouter
```

# Example

main-app.js
```js

var render = require('koa-cheerio-template');
var autorouter = require('koa-autorouter');

var options = {
  root: path.join(__dirname, 'views/'),
  bundles: 'public/bundles/',
  ext: '.html'
};

app.use(render(options));
app.use(autorouter(options));

```

# Controller
/app/user/index.js
```js

// optional middleware, call before each controller
exports.middleware = function *() {
  this.state.posts = yield ...
};

// GET /
exports.index = function *() {
  yield this.view();
};

// POST /
exports.create = function *() {
  // using this.state ...
};

// GET /:id
exports.select = function *() {
  let id = this.state.id;
  // ...
};

// POST /:id
exports.update = function *() {
  let id = this.state.id;
  // ...
};

// GET /:id/edit
exports.edit = function *() {
  let id = this.state.id;
  // ...
};

// POST /:id/edit
exports.save = function *() {
  let id = this.state.id;
  // ...
};

// GET /:id/delete
exports.delete = function *() {
  let id = this.state.id;
  // ...
};

```

# Sample Application
See the full [example](https://github.com/korbai/koa-cheerio-template/tree/master/example)!
Usage for route and URL matching. You can test with the following URLs:
http://localhost:3000/ -> controller: /views/index.js
http://localhost:3000/reports/help -> controller: /views/reports/help.js
http://localhost:3000/admin/reports/daily -> controller: /views/admin/reports/daily/index.js
http://localhost:3000/admin/help -> controller: none, only view: /views/admin/help.html
http://localhost:3000/admin -> controller: /views/admin/index.js

# License

  MIT
