'use strict';

var fs = require('fs');
var cofs = require('co-fs');
var path = require('path');
var _ = require('lodash');
var compose = require('koa-compose');
var debug = require('debug')('autorouter');
//debug = console.log;

module.exports = function (settings) {
  settings = settings || {};
  settings.root = settings.root || __dirname;
  settings.ext = settings.ext || '.html';

  var views = [];
  var middlewares = [autoviewer];

  debug('registering controllers and views at', settings.root);
  var router = require('koa-router')();
  register(settings.root);
  middlewares.push(router.routes());
  middlewares.push(router.allowedMethods());
  middlewares.push(standalones);
  return compose(middlewares);

  function *view(opts) {
    var url = this.request.path;  // without query string
    var view = views[url];
    // fallback if e.g. ID in the url
    while (!view) {
      debug('view fallback for', url);
      // cur the last /
      if (url[url.length - 1] === '/') {
        url = url.substr(0, url.length - 1);
      }
      let i = url.lastIndexOf('/');
      if (i === -1) {
        break;
      }
      url = url.substr(0, i);
      view = views[url];
    }
    debug(url, '-> view', view + settings.ext);
    return yield this.render(view, opts);
  }

  function *autoviewer(next) {
    this.view = view;
    yield next;
  }

  // some view maybe has not got controller (e.g. simple help page)
  function *standalones(next) {
    var url = this.request.path;
    var abs = path.join(settings.root, url);
    if (yield cofs.exists(abs)) {
      debug('standalone with ext', url);
      url = url.substr(0, url.length - settings.ext.length);
      return yield this.render(url);
    }
    abs += settings.ext;
    if (yield cofs.exists(abs)) {
      debug('standalone', url + settings.ext);
      return yield this.render(url);
    }
    yield next;
  }

  function *copyId(next) {
    this.state.id = this.params.id;
    yield next;
  }

  // a lot of Sync, sorry, but this run only once during startup
  function register(root, rel) {
    rel = (rel || '').replace(/\\/g, '/'); // for windows compatibility
    var dir = path.join(root, rel);

    var items = [];
    fs.readdirSync(dir).forEach(function (item) {
      var absPath = path.join(dir, item);
      var stat = fs.statSync(absPath);
      //debug('registering ' + absPath);
      var node = {name: item, type: -1};
      if (stat.isDirectory()) {
        node.type = 0;
      }
      else if (item === 'index.js') {
        node.type = 2;
      }
      // something.js is controller, but something.html.js is not
      else if (item.slice(-3) === '.js' && (item.slice(-3 - settings.ext.length) !== settings.ext + '.js')) node.type = 1;
      if (node.type >= 0) items.push(node);
    });

    items.sort(function (a, b) {
      return a.type - b.type;
    });

    items.forEach(function (node) {
      var item = node.name;
      var absPath = path.join(dir, item);
      var stat = fs.statSync(absPath);
      if (stat.isDirectory()) {
        register(root, path.join(rel, item));
      } else if (stat.isFile()) {
        if (path.extname(absPath) === '.js') {
          var route = '/' + rel;
          var view = route;
          if (item === 'index.js') {
            if (view !== '/') {
              view += '/';
            }
            view += 'index';
          } else {
            if (route !== '/') route += '/';
            route += item.slice(0, -3);
            view = route;
          }

          while (view.length && !fs.existsSync(path.join(root, view + settings.ext))) {
            //debug(view, "not found -> fallback");
            var index = view.slice(-settings.ext.length) === 'index' ? '' : '/index';
            view = view.substring(0, view.lastIndexOf('/')) + index;
          }

          views[route] = view;
          debug(route + ' -> ' + view + settings.ext);
          var controller = require(absPath);

          let middlewares = controller['middleware'] || [];
          if (!_.isArray(middlewares)) {
            middlewares = [middlewares];
          }

          let args = [];
          for (let name in controller) {
            let action = controller[name];
            switch (name) {
              case 'index':
                args = _.flatten([route, middlewares, action]);
                router.get.apply(router, args);
                break;
              case 'create':
                args = _.flatten([route, middlewares, action]);
                router.post.apply(router, args);
                break;
              case 'select':
                args = _.flatten([route + '/:id', copyId, middlewares, action]);
                router.get.apply(router, args);
                break;
              case 'update':
                args = _.flatten([route + '/:id', copyId, middlewares, action]);
                router.post.apply(router, args);
                break;
              case 'edit':
                args = _.flatten([route + '/:id/edit', copyId, middlewares, action]);
                router.get.apply(router, args);
                break;
              case 'save':
                args = _.flatten([route + '/:id/edit', copyId, middlewares, action]);
                router.post.apply(router, args);
                break;
              case 'delete':
                args = _.flatten([route + '/:id/delete', copyId, middlewares, action]);
                router.get.apply(router, args);
                break;
              default:
                debug('skip', absPath + ':' + name);
                break;
            }
          }
        }
      }
    });
  }
};